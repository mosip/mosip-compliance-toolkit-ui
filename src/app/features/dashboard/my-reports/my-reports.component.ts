import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import Utils from 'src/app/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { ReportModel } from 'src/app/core/models/report-model';

@Component({
  selector: 'app-my-reports',
  templateUrl: './my-reports.component.html',
  styleUrls: ['./my-reports.component.css'],
})
export class MyReportsComponent implements OnInit {
  displayedColumns: string[] = [
    'projectType',
    'projectName',
    'collectionName',
    'partnerComments',
    'reviewDtimes',
    'approveRejectDtimes',
    'adminComments',
    'downloadButton',
    'reportStatus'
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataSource = new MatTableDataSource<ReportModel>();
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any =
    this.textDirection == 'rtl' ? { float: 'left' } : { float: 'right' };
  resourceBundleJson: any = {};
  dataLoaded = false;
  subscriptions: Subscription[] = [];
  
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());

    this.resourceBundleJson = await Utils.getResourceBundle(
      this.userProfileService.getUserPreferredLanguage(),
      this.dataService
    );
    await this.getSubmittedReportList();
    this.dataLoaded = true;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = this.customFilterPredicate;
  }

  customFilterPredicate(data: ReportModel, filter: string): boolean {
    const formattedDate = new Date(filter);
    const rvDate = new Date(data.reviewDtimes);
    const appRejDate = new Date(data.approveRejectDtimes);
    
    const projectNameMatch = data.projectName ? data.projectName.trim().toLowerCase().includes(filter): false;
    const collectionNameMatch = data.collectionName ? data.collectionName.trim().toLowerCase().includes(filter): false;
    const reportStatusMatch = data.reportStatus ? data.reportStatus.trim().toLowerCase().includes(filter): false;

    const typeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const dateMatch = rvDate.toDateString() === formattedDate.toDateString();
    const dateMatch1 = appRejDate.toDateString() === formattedDate.toDateString();

    return projectNameMatch || collectionNameMatch || typeMatch || dateMatch || dateMatch1 || reportStatusMatch;
  }

  async fetchPartnerReport(element: any) {
    this.dataLoaded = false;
    await Utils.getReport(false, element, this.dataService, this.resourceBundleJson, this.dialog);
    this.dataLoaded = true;
  }

  async getSubmittedReportList(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSubmittedReportList().subscribe(
          (response: any) => {
            (async () => {
              const dataArr = response['response'];
              this.dataSource = new MatTableDataSource(
                dataArr
              );
              resolve(true);
            })().catch((error) => reject(error));
          },
          (errors) => {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              errors,
              this.dialog
            );
            resolve(false);
          }
        )
      );
    });
  }
}
