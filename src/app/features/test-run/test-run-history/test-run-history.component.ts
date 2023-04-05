import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
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
  dataSource: MatTableDataSource<TestRunHistoryModel>;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : 'null';
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
    await this.initAllParams();
    await this.getCollection();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.SDK) {
      await this.getSdkProjectDetails();
      this.initBreadCrumb();
    }
    await this.getTestRunHistory();
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    if (this.sbiProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sbiProjectData.name}`
      );
    }
    if (this.sdkProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sdkProjectData.name}`
      );
    }
    this.breadcrumbService.set(
      '@collectionBreadCrumb',
      `${this.collectionName}`
    );
    this.breadcrumbService.set('@testrunBreadCrumb', `Test Run History`);
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

  async getCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getCollection(this.collectionId).subscribe(
          (response: any) => {
            this.collectionName = response['response']['name'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
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
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(this.projectId).subscribe(
          (response: any) => {
            console.log(response);
            this.sbiProjectData = response['response'];
            console.log(this.sbiProjectData);
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getSdkProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSdkProject(this.projectId).subscribe(
          (response: any) => {
            //console.log(response);
            this.sdkProjectData = response['response'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(errors, this.dialog);
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
            async (response: any) => {
              console.log(response);
              await this.populateTableData(response);
              resolve(true);
            },
            (errors) => {
              Utils.showErrorMessage(errors, this.dialog);
              resolve(false);
            }
          )
      );
    });
  }
  backToProject() {
    this.router.navigate([
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

  viewTestRun(row: any) {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${row.runId}`,
    ]);
  }

  deleteTestRun(row: any) {
    this.dataLoaded = false;
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.deleteTestRun(row.runId).subscribe(
          async (response: any) => {
            this.dataLoaded = true;
            console.log(response);
            await this.getTestRunHistory();
            this.dataLoaded = true;
          },
          (errors) => {
            this.dataLoaded = true;
            Utils.showErrorMessage(errors, this.dialog);
          }
        )
      );
    });
  }
}
