import { Component, OnInit } from '@angular/core';
import { BreadcrumbService } from 'xng-breadcrumb';
import { Router, ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-view-project',
  templateUrl: './view-project.component.html',
  styleUrls: ['./view-project.component.css'],
})
export class ViewProjectComponent implements OnInit {
  projectId: string;
  projectType: string;
  projectForm = new FormGroup({});
  projectData: any;
  commonControls = ['name', 'projectType'];
  sdkControls = ['sdkUrl', 'sdkPurpose', 'bioTestData'];
  sbiControls = ['specVersion', 'sbiPurpose', 'deviceType', 'deviceSubType'];
  abisControls = ['abisUrl', 'username', 'password', 'queueName'];
  allControls: string[];
  hidePassword = true;
  subscriptions: Subscription[] = [];
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
    await this.getProjectId();
    if (this.projectType == appConstants.SBI) {
      this.allControls = [...this.commonControls, ...this.sbiControls];
      this.allControls.forEach((controlId) => {
        this.projectForm.addControl(controlId, new FormControl(''));
        this.projectForm.controls[controlId].disable({ onlySelf: true });
      });
      await this.getSbiProjectDetails();
      if (this.projectData) {
        this.projectForm.controls['name'].setValue(this.projectData.name);
        this.projectForm.controls['projectType'].setValue(appConstants.SBI);
        this.projectForm.controls['specVersion'].setValue(
          this.projectData.sbiVersion
        );
        this.projectForm.controls['sbiPurpose'].setValue(
          this.projectData.purpose
        );
        this.projectForm.controls['deviceType'].setValue(
          this.projectData.deviceType
        );
        this.projectForm.controls['deviceSubType'].setValue(
          this.projectData.deviceSubType
        );
      }
    }
    if (this.projectData) {
      this.breadcrumbService.set(
        '@projectId',
        `${this.projectType} Project - ${this.projectData.name}`
      );
    }
    this.dataLoaded = true;
  }

  getProjectId() {
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
      this.dataService.getSbiProject(this.projectId).subscribe(
        (response: any) => {
          console.log(response);
          this.projectData = response['response'];
          resolve(true);
        },
        (error) => {
          this.showErrorMessage(error);
          resolve(false);
        }
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
}
