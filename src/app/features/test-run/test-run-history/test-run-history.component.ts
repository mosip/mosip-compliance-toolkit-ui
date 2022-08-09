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
import { MatSort } from '@angular/material/sort';
import Utils from 'src/app/app.utils';
import { TestRunHistoryModel } from 'src/app/core/models/testrunhistory';

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
  dataSource: MatTableDataSource<TestRunHistoryModel>;
  displayedColumns: string[] = [
    'runId',
    'lastRunTime',
    'runStatus',
    'testCaseCount',
    'passCaseCount',
    'failCaseCount',
    'actions',
  ];
  dataSubmitted = false;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.initAllParams();
    await this.getCollection();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
      this.initBreadCrumb();
    }
    await this.getTestRunHistory();
    this.dataSource.sort = this.sort;
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    if (this.sbiProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sbiProjectData.name}`
      );
      this.breadcrumbService.set(
        '@collectionBreadCrumb',
        `${this.collectionName}`
      );
      this.breadcrumbService.set('@testrunBreadCrumb', `Test Run History`);
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

  async getTestRunHistory() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunHistory(this.collectionId).subscribe(
          async (response: any) => {
            console.log(response);
            let dataArr = response['response'];
            dataArr.sort(function (
              a: TestRunHistoryModel,
              b: TestRunHistoryModel
            ) {
              if (a.lastRunTime < b.lastRunTime) return 1;
              if (a.lastRunTime > b.lastRunTime) return -1;
              return 0;
            });
            let tableData = [];
            for (let row of dataArr) {
              let runStatus = await this.getTestRunStatus(row.runId);
              tableData.push({
                ...row,
                runStatus: runStatus
              });
            }
            this.dataSource = new MatTableDataSource(tableData);
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

  viewTestRun(row: any) {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${row.runId}`,
    ]);
  }
}
