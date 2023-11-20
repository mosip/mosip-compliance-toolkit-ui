import { AfterViewInit, OnInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/core/services/data-service';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { ReportModel } from 'src/app/core/models/report-model';
import { AppConfigService } from 'src/app/app-config.service';

@Component({
  selector: 'app-partner-reports',
  templateUrl: './partner-reports.component.html',
  styleUrls: ['./partner-reports.component.css'],
})
export class PartnerReportsComponent implements AfterViewInit {


  constructor(
    private appConfigService: AppConfigService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService,
    private paginatorIntl: MatPaginatorIntl
  ) { }

  displayedColumns: string[] = [
    'partnerId',
    'projectType',
    'projectName',
    'collectionName',
    'reportStatus',
    'partnerComments',
    'reviewDtimes',
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
    const adminRole = this.appConfigService.getConfig()['adminPartnerReportRole'];
    this.isAdmin = this.userProfileService.hasRole(adminRole);
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
    const rvDate = new Date(data.reviewDtimes);
    const projectNameMatch = data.projectName ? data.projectName.trim().toLowerCase().includes(filter): false;
    const collectionNameMatch = data.collectionName ? data.collectionName.trim().toLowerCase().includes(filter): false;

    const partnerIdMatch = data.partnerId.trim().toLowerCase().includes(filter);
    const projectTypeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const reviewDtMatch = rvDate.toDateString() === formattedDate.toDateString();
    //const dateMatch1 = appRejDate.toDateString() === formattedDate.toDateString();

    return partnerIdMatch || projectTypeMatch || projectNameMatch || collectionNameMatch || reviewDtMatch;
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
            link.download = element.partnerId;
            link.click();
          } else {
            Utils.showErrorMessage(this.resourceBundleJson,
              null,
              this.dialog,
              'Unable to download PDF file. Try Again!');
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
      adminComments: element.adminComments
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
        async (res: any) => {
          this.dataLoaded = true;
          if (res) {
            await this.getPartnerReportList('review');
            this.dataLoaded = true;
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
        async (res: any) => {
          this.dataLoaded = true;
          if (res) {
            await this.getPartnerReportList('review');
            this.dataLoaded = true;
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
