import { OnInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DataService } from 'src/app/core/services/data-service';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { ReportModel } from 'src/app/core/models/report-model';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-partner-reports',
  templateUrl: './partner-reports.component.html',
  styleUrls: ['./partner-reports.component.css'],
})
export class PartnerReportsComponent implements OnInit {


  constructor(
    private router: Router,
    private appConfigService: AppConfigService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService
  ) { }

  displayedColumns: string[] = [
    'partnerId',
    'orgName',
    'projectType',
    'projectName',
    'partnerComments',
    'reviewDtimes',
    'reportStatus',
    'downloadButton',
    'runId',
    'approveButton',
    'rejectButton',
    'adminComments',
    'approveRejectDtimes'
  ];
  dataSource = new MatTableDataSource<ReportModel>();
  dataLoaded = false;
  projectFormData: any;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any =
    this.textDirection == 'rtl' ? { float: 'left' } : { float: 'right' };
  resourceBundleJson: any = {};
  isAdmin: boolean = false;
  selectedReportStatus = appConstants.REPORT_STATUS_REVIEW;

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    const adminRole = this.appConfigService.getConfig()['adminPartnerReportRole'];
    this.isAdmin = this.userProfileService.hasRole(adminRole);
    this.resourceBundleJson = await Utils.getResourceBundle(
      this.userProfileService.getUserPreferredLanguage(),
      this.dataService
    );
    await this.getPartnerReportList();
    this.dataLoaded = true;
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
    const appRejDate = new Date(data.approveRejectDtimes);

    const projectNameMatch = data.projectName ? data.projectName.trim().toLowerCase().includes(filter) : false;
    const collectionNameMatch = data.collectionName ? data.collectionName.trim().toLowerCase().includes(filter) : false;
    const partnerIdMatch = data.partnerId.trim().toLowerCase().includes(filter);
    const projectTypeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const reviewDtMatch = rvDate.toDateString() === formattedDate.toDateString();
    const reportStatusMatch = data.reportStatus ? data.reportStatus.trim().toLowerCase().includes(filter) : false;
    const orgNameMatch = data.orgName ? data.orgName.trim().toLowerCase().includes(filter) : false;
    const appRejDateMatch = appRejDate.toDateString() === formattedDate.toDateString();

    return partnerIdMatch || appRejDateMatch || projectTypeMatch || projectNameMatch || collectionNameMatch || reviewDtMatch || reportStatusMatch || orgNameMatch;
  }

  async getPartnerReportList() {
    this.dataSource = new MatTableDataSource<ReportModel>();
    let reports: ReportModel[] = [];
    switch (this.selectedReportStatus) {
      case 'approved':
        reports = await this.fetchPartnerReportList(appConstants.REPORT_STATUS_APPROVED) as ReportModel[];
        break;
      case 'rejected':
        reports = await this.fetchPartnerReportList(appConstants.REPORT_STATUS_REJECTED) as ReportModel[];
        break;
      default:
        reports = await this.fetchPartnerReportList(appConstants.REPORT_STATUS_REVIEW) as ReportModel[];
        break;
    }
    this.dataSource = new MatTableDataSource<ReportModel>(reports);
  }

  async fetchPartnerReportList(reportStatus: string) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getPartnerReportList(reportStatus).subscribe(
          (response: any) => {
            const dataArr = response['response'] as ReportModel[];
            resolve(dataArr);
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

  async fetchPartnerReport(element: any) {
    await Utils.getReport(this.isAndroidAppMode, true, element, this.dataService, this.resourceBundleJson, this.dialog);
  }

  approvePartnerReport(element: any) {
    let approveRequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId,
    };
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '600px',
      data: {
        case: "ADMIN_APPROVE_REPORT",
        partnerId: element.partnerId,
        approveRequest: approveRequest
      },
    });
    dialogRef.afterClosed().subscribe(
      async () => {
        this.dataLoaded = false;
        await this.getPartnerReportList();
        this.dataLoaded = true;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    );
  }

  rejectPartnerReport(element: any) {
    let rejectRequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId
    };
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '600px',
      data: {
        case: "ADMIN_REJECT_REPORT",
        partnerId: element.partnerId,
        rejectRequest: rejectRequest
      },
    });
    dialogRef.afterClosed().subscribe(
      async () => {
        this.dataLoaded = false;
        await this.getPartnerReportList();
        this.dataLoaded = true;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    );
  }

  async viewPartnerTestRun(row: any) {
    await this.router.navigate([
      `toolkit/project/${row.projectType}/${row.projectId}/collection/${row.collectionId}/testrun/${row.runId}/${row.partnerId}`,
    ]);
  }
}
