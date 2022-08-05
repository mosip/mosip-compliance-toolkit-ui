import { Component, OnInit, ViewChild } from '@angular/core';
import { BreadcrumbService } from 'xng-breadcrumb';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { DataService } from '../../../core/services/data-service';
import { Subscription } from 'rxjs';
import * as appConstants from 'src/app/app.constants';
import { MatDialog } from '@angular/material/dialog';
import { ScanDeviceComponent } from '../../test-run/scan-device/scan-device.component';
import { ExecuteTestRunComponent } from '../../test-run/execute-test-run/execute-test-run.component';
import Utils from 'src/app/app.utils';

export interface CollectionsData {
  collectionId: string;
  name: string;
  testCaseCount: number;
  crDtimes: Date;
  runDtimes: Date;
  runId: string;
}
@Component({
  selector: 'app-view-project',
  templateUrl: './view-project.component.html',
  styleUrls: ['./view-project.component.css'],
})
export class ViewProjectComponent implements OnInit {
  projectId: string;
  projectType: string;
  projectForm = new FormGroup({});
  projectFormData: any;
  allControls: string[];
  dataSource: MatTableDataSource<CollectionsData>;
  displayedColumns: string[] = [
    'name',
    'testCaseCount',
    'crDtimes',
    'runDtimes',
    'actions',
    'actionsMore',
  ];
  isScanComplete =
    localStorage.getItem(appConstants.SBI_SCAN_COMPLETE) == 'true'
      ? true
      : false;
  hidePassword = true;
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataLoaded = false;
  panelOpenState = false;
  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private dialog: MatDialog,
    private breadcrumbService: BreadcrumbService,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.initProjectIdAndType();
    if (this.projectType == appConstants.SBI) {
      this.initSbiProjectForm();
      await this.getSbiProjectDetails();
      this.populateSbiProjectForm();
    }
    await this.getCollections();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.initBreadCrumb();
    this.dataLoaded = true;
  }

  initProjectIdAndType() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['projectId'];
        this.projectType = param['projectType'];
      });
      resolve(true);
    });
  }

  initBreadCrumb() {
    if (this.projectFormData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.projectFormData.name}`
      );
    }
  }

  initSbiProjectForm() {
    this.allControls = [
      ...appConstants.COMMON_CONTROLS,
      ...appConstants.SBI_CONTROLS,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(
        controlId,
        new FormControl({ value: '', disabled: true })
      );
    });
  }

  populateSbiProjectForm() {
    if (this.projectFormData) {
      this.projectForm.controls['name'].setValue(this.projectFormData.name);
      this.projectForm.controls['projectType'].setValue(appConstants.SBI);
      this.projectForm.controls['sbiSpecVersion'].setValue(
        this.projectFormData.sbiVersion
      );
      this.projectForm.controls['sbiPurpose'].setValue(
        this.projectFormData.purpose
      );
      this.projectForm.controls['deviceType'].setValue(
        this.projectFormData.deviceType
      );
      this.projectForm.controls['deviceSubType'].setValue(
        this.projectFormData.deviceSubType
      );
    }
  }

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(this.projectId).subscribe(
          (response: any) => {
            console.log(response);
            this.projectFormData = response['response'];
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

  async getCollections() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getCollections(this.projectId, this.projectType)
          .subscribe(
            (response: any) => {
              console.log(response);
              this.dataSource = new MatTableDataSource(
                response['response']['collections']
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  showDashboard() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`toolkit/dashboard`]);
    } else {
      this.router.navigate([``]);
    }
  }

  addCollection() {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/add`,
    ]);
  }

  viewCollection(collection: any) {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${collection.collectionId}`,
    ]);
  }

  scanDevice() {
    const body = {
      title: 'Scan Device',
    };
    this.dialog
      .open(ScanDeviceComponent, {
        width: '600px',
        data: body,
      })
      .afterClosed()
      .subscribe(
        () =>
          (this.isScanComplete =
            localStorage.getItem(appConstants.SBI_SCAN_COMPLETE) == 'true'
              ? true
              : false)
      );
  }
  async runCollection(row: any) {
    const body = {
      collectionId: row.collectionId,
      projectType: this.projectType,
      projectId: this.projectId
    };
    this.dialog
      .open(ExecuteTestRunComponent, {
        width: '700px',
        data: body,
      })
      .afterClosed()
      .subscribe(() =>
      {
        console.log("closed");
        //this.router.navigate([`toolkit/dashboard`]);
        // this.router.navigate([
        //   `toolkit/project/${this.projectType}/${this.projectId}`,
        // ]);
      });
  }

  viewTestRun(row: any) {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${row.collectionId}/testrun/${row.runId}`,
    ]);
  }
}
