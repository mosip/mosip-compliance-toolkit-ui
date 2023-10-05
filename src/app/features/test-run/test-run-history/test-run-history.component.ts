import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/authservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbService } from 'xng-breadcrumb';
import { MatTableDataSource } from '@angular/material/table';
import Utils from 'src/app/app.utils';
import { TestRunHistoryModel } from 'src/app/core/models/testrunhistory';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { AbisProjectModel } from 'src/app/core/models/abis-project';
import { error } from 'console';

@Component({
  selector: 'app-test-run-history',
  templateUrl: './test-run-history.component.html',
  styleUrls: ['./test-run-history.component.css'],
})
export class TestRunHistoryComponent implements OnInit {
  collectionId: string;
  collectionName: string;
  projectId: string;
  projectType: string;
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  dataSource: MatTableDataSource<TestRunHistoryModel>;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : {'float': 'right'};
  displayedColumns: string[] = [
    'lastRunTime',
    'runStatus',
    'testCaseCount',
    'passCaseCount',
    'failCaseCount',
    'actions',
    'scrollIcon'
  ];
  // MatPaginator Inputs
  totalItems = 0;
  defaultPageSize = 10;
  pageSize = this.defaultPageSize;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  dataSubmitted = false;
  resourceBundleJson: any = {};

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    await this.initAllParams();
    const collectionRes = await Utils.getCollectionNameAndType(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
    this.collectionName = collectionRes.name;
    if (this.projectType == appConstants.SBI) {
      const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sbiProjectDetails) {
        this.sbiProjectData = sbiProjectDetails;
      }
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.SDK) {
      const sdkProjectDetails: any = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sdkProjectDetails) {
        this.sdkProjectData = sdkProjectDetails;
      }
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.ABIS) {
      const abisProjectDetails: any = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(abisProjectDetails) {
        this.abisProjectData = abisProjectDetails;
      }
      this.initBreadCrumb();
    }
    await this.getTestRunHistory();
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        this.sbiProjectData, this.sdkProjectData, this.abisProjectData, 
        this.projectType, this.collectionName);
      this.breadcrumbService.set('@testrunBreadCrumb', `${breadcrumbLabels.testRunHistory}`);
    }
  }

  initAllParams() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['projectId'];
        this.projectType = param['projectType'];
        this.collectionId = param['collectionId'];
      });
      resolve(true);
    });
  }

  async getTestRunStatus(runId: string) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunStatus(runId).subscribe(
          (response: any) => {
            resolve(response['response']['resultStatus']);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }
  
  async getTestRunHistory() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getTestRunHistory(this.collectionId, this.pageIndex, this.pageSize)
          .subscribe(
            (response: any) => {
              console.log(response);
              this.populateTableData(response)
                .then(() => {
                  resolve(true);
                })
                .catch((error) => {
                  reject(error);
                });
            },
            (errors) => {
              Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
              resolve(false);
            }
          )
      );
    });
  }
  async backToProject() {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }

  async populateTableData(response: any) {
    if (response && response['errors'] && response['errors'].length != 0) {
      if (this.dataSource && this.dataSource.data) {
        this.dataSource.data = [];
      }
    }
    if (response && response['errors'] && response['errors'].length == 0) {
      if (this.dataSource && this.dataSource.data) {
        this.dataSource.data = [];
      }
      const resp = response['response'];
      let dataArr = resp['content'];
      this.totalItems = parseInt(resp['totalElements']);
      this.pageIndex = parseInt(resp['pageNo']);
      this.pageSize = parseInt(resp['pageSize']);
      console.log(`this.totalItems: ${this.totalItems}`);
      console.log(`this.pageIndex: ${this.pageIndex}`);
      console.log(`this.pageSize: ${this.pageSize}`);
      if (dataArr && dataArr.length > 0) {
        dataArr.sort(function (a: TestRunHistoryModel, b: TestRunHistoryModel) {
          if (a.lastRunTime < b.lastRunTime) return 1;
          if (a.lastRunTime > b.lastRunTime) return -1;
          return 0;
        });
      }
      let tableData = [];
      for (let row of dataArr) {
        let runStatus = await this.getTestRunStatus(row.runId);
        tableData.push({
          ...row,
          runStatus: runStatus,
        });
      }
      this.dataSource = new MatTableDataSource(tableData);
    }
  }

  async showResults(pageEvent: any) {
    this.dataLoaded = false;
    if (pageEvent) {
      this.pageSize = pageEvent.pageSize;
      this.pageIndex = pageEvent.pageIndex;
    }
    await this.getTestRunHistory();
    this.dataLoaded = true;
  }

  async viewTestRun(row: any) {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${row.runId}`,
    ]);
  }

  deleteTestRun(row: any) {
    this.dataLoaded = false;
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.deleteTestRun(row.runId).subscribe(
          (response: any) => {
            this.dataLoaded = true;
            console.log(response);
            this.getTestRunHistory()
              .then(() => {
                this.dataLoaded = true;
              })
              .catch((error) => {
                reject(error);
              });
          },
          (errors) => {
            this.dataLoaded = true;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
          }
        )
      );
    });
  }
}
