import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortable } from '@angular/material/sort';
import { DataService } from 'src/app/core/services/data-service';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';
import { ReportModel } from 'src/app/core/models/report-model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements AfterViewInit {
  partnerName: string;
  partnerId: String;
  orgName: String;
  projectType: String;
  collectionName: String;
  projectName: String;
  updDtimes: Date;
  runId: String;
  collectionId: String;
  projectId: String;
  adminComments: String;
  partnerComments: String;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService,
    private paginatorIntl: MatPaginatorIntl
  ) {}

  displayedColumns: string[] = [
    'partnerName',
    'orgName',
    'projectType',
    'collectionName',
    'projectName',
    'updDtimes',
    'downloadButton',
    'approveOrRejectButton',
  ];
  dataSource = new MatTableDataSource<ReportModel>();
  dataLoaded = false;
  projectFormData: any;
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any =
    this.textDirection == 'rtl' ? { float: 'left' } : { float: 'right' };
  resourceBundleJson: any = {};
  isAdmin: boolean = false;

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.isAdmin = this.userProfileService.hasRole('CTK_ADMIN');
    this.resourceBundleJson = await Utils.getResourceBundle(
      this.userProfileService.getUserPreferredLanguage(),
      this.dataService
    );
    this.paginatorIntl.itemsPerPageLabel =
      this.resourceBundleJson.paginationLabel['itemPerPage'];
    this.paginatorIntl.getRangeLabel = (
      page: number,
      pageSize: number,
      length: number
    ) => {
      const from = page * pageSize + 1;
      const to = Math.min((page + 1) * pageSize, length);
      return `${from} - ${to} ${this.resourceBundleJson.paginationLabel['rangeLabel']} ${length}`;
    };
    await this.getPartnerReportList('review');
    this.dataLoaded = true;
    this.dataSource.paginator = this.paginator;
    this.sort.sort({ id: 'lastRunDt', start: 'desc' } as MatSortable);
    this.dataSource.sort = this.sort;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = this.customFilterPredicate;
  }

  customFilterPredicate(data: ReportModel, filter: string): boolean {
    const formattedDate = new Date(filter);
    const updDtimes = new Date(data.updDtimes);

    const nameMatch = data.partnerName.trim().toLowerCase().includes(filter);
    const typeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const dateMatch = updDtimes.toDateString() === formattedDate.toDateString();

    return nameMatch || typeMatch || dateMatch;
  }

  async getPartnerReportList(reportStatus: string) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getPartnerReportList(reportStatus).subscribe(
          (response: any) => {
            const dataArr = response['response'] as ReportModel[];
            this.dataSource = new MatTableDataSource<ReportModel>(dataArr);
            this.dataSource.sort = this.sort;
            resolve(true);
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

  fetchPartnerReport(element: any) {
    this.dataLoaded = false;
    let reportrequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId,
      adminComments: element.adminComments,
      partnerComments: element.adminComments,
    };

    let request = {
      id: appConstants.ADMIN_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: reportrequest,
    };

    const subs = this.dataService
      .getPartnerReport(element.partnerId, request)
      .subscribe(
        (res: any) => {
          this.dataLoaded = true;
          if (res) {
            const fileByteArray = res;
            var blob = new Blob([fileByteArray], { type: 'application/pdf' });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = element.projectName;
            link.click();
          } else {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'Unable to download PDF file. Try Again!'
            );
          }
        },
        (errors) => {
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
        }
      );

    this.subscriptions.push(subs);
  }

  approvePartnerReport(element: any) {
    this.dataLoaded = false;
    let approverequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId,
      adminComments: element.adminComments,
      partnerComments: element.adminComments,
    };

    let request = {
      id: appConstants.ADMIN_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: approverequest,
    };

    const subs = this.dataService
      .approvePartnerReport(element.partnerId, request)
      .subscribe(
        (res: any) => {
          this.dataLoaded = true;
          if (res) {
            element.isApproved = true;
            console.log('Partner report approved successfully:');
          } else {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'Unable to approve report. Try Again!'
            );
          }
        },
        (errors) => {
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
        }
      );

    this.subscriptions.push(subs);
  }

  rejectPartnerReport(element: any) {
    this.dataLoaded = false;
    let approverequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId,
      adminComments: element.adminComments,
      partnerComments: element.adminComments,
    };

    let request = {
      id: appConstants.ADMIN_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: approverequest,
    };

    const subs = this.dataService
      .rejectPartnerReport(element.partnerId, request)
      .subscribe(
        (res: any) => {
          this.dataLoaded = true;
          if (res) {
            element.isRejected = true;
            console.log('Partner report rejected successfully:');
          } else {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'Unable to reject report. Try Again!'
            );
          }
        },
        (errors) => {
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
        }
      );

    this.subscriptions.push(subs);
  }
}
