import { Component, OnInit, ViewChild } from '@angular/core';
import { BreadcrumbService } from 'xng-breadcrumb';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { DataService } from '../../../core/services/data-service';
import { Subscription } from 'rxjs';
import * as appConstants from 'src/app/app.constants';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../../core/components/dialog/dialog.component';

export interface CollectionsData {
  id: string;
  name: string;
  testcasesCount: number;
  crDtimes: Date;
  runDtimes: Date;
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
    'testcasesCount',
    'crDtimes',
    'runDtimes'
  ];
  hidePassword = true;
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  dataLoaded = false;
  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private dialog: MatDialog,
    private breadcrumbService: BreadcrumbService,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.getProjectIdAndType();
    if (this.projectType == appConstants.SBI) {
      this.initSbiProjectForm();
      await this.getSbiProjectDetails();
      this.populateSbiProjectForm();
    }
    await this.getProjectCollections();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    if (this.projectFormData) {
      this.breadcrumbService.set(
        '@projectId',
        `${this.projectType} Project - ${this.projectFormData.name}`
      );
    }
    this.dataLoaded = true;
  }

  initSbiProjectForm() {
    this.allControls = [
      ...appConstants.commonControls,
      ...appConstants.sbiControls,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(controlId, new FormControl(''));
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
  getProjectIdAndType() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['id'];
        this.projectType = param['projectType'];
        resolve(true);
      });
    });
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
          (error) => {
            this.showErrorMessage(error);
            resolve(false);
          }
        )
      );
    });
  }

  async getProjectCollections() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjectCollections(this.projectId, this.projectType).subscribe((response: any) => {
          console.log(response);
          this.dataSource = new MatTableDataSource(
            response['response']['collectionsSummaryList']
          );
          resolve(true);
        },
        (error) => {
          this.showErrorMessage(error);
          resolve(false);
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
  /**
   * @description This is a dialoug box whenever an error comes from the server, it will appear.
   *
   * @private
   * @memberof DemographicComponent
   */
  private showErrorMessage(errorsList: any) {
    let error = errorsList[0];
    const titleOnError = 'Error';
    const message = error.errorCode + ' - ' + error.message;
    const body = {
      case: 'ERROR',
      title: titleOnError,
      message: message,
    };
    this.dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
  }
  
  showDashboard() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`toolkit/dashboard`]);
    } else {
      this.router.navigate([``]);
    }
  }
  addCollection() {

  }
}
