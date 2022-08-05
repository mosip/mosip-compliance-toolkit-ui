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
import { TestRunModel } from 'src/app/core/models/testrun';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-test-run',
  templateUrl: './test-run.component.html',
  styleUrls: ['./test-run.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class TestRunComponent implements OnInit {
  collectionId: string;
  collectionName: string;
  runId: string;
  projectId: string;
  projectType: string;
  collectionForm = new FormGroup({});
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  dataSource: MatTableDataSource<TestRunModel>;
  displayedColumns: string[] = [
    'testOrderSequence',
    'testId',
    'testName',
    'resultStatus',
  ];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  expandedElement: TestRunModel | null;
  dataSubmitted = false;
  panelOpenState = false;
  runDetails: any;

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
    }
    await this.getTestRun();
    this.initBreadCrumb();
    this.dataLoaded = true;
  }

  initAllParams() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectType = param['projectType'];
        this.projectId = param['projectId'];
        this.collectionId = param['collectionId'];
        this.runId = param['runId'];
      });
      resolve(true);
    });
  }

  async getTestRun() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRun(this.collectionId, this.runId).subscribe(
          (response: any) => {
            console.log('TEST RUN');
            console.log(response['response']['testcases']);
            this.runDetails = response['response'];
            this.dataSource = new MatTableDataSource(
              response['response']['testcases']
            );
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
      this.breadcrumbService.set('@testrunBreadCrumb', `Test Run - (${new Date(this.runDetails.runDtimes).toLocaleString()})`);
    }
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

  getValidationsList(row: any): any[] {
    let jsonData = JSON.parse(row.resultDescription);
    let list = jsonData["validationsList"];
    return list;
  }
  backToProject() {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }
}
