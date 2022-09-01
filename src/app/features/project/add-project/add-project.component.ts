import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';

@Component({
  selector: 'app-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
})
export class AddProjectComponent implements OnInit {
  projectForm = new FormGroup({});
  allControls: string[];
  subscriptions: Subscription[] = [];
  bioTestDataFileNames: string[] = [];
  hidePassword = true;
  dataLoaded = true;
  dataSubmitted = false;

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    this.initForm();
    await this.getBioTestDataFileNames();
  }

  initForm() {
    this.allControls = [
      ...appConstants.COMMON_CONTROLS,
      ...appConstants.SBI_CONTROLS,
      ...appConstants.SDK_CONTROLS,
      ...appConstants.ABIS_CONTROLS,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(controlId, new FormControl(''));
    });
    appConstants.COMMON_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
    });
  }

  async getBioTestDataFileNames() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getBioTestDataFileNames()
          .subscribe(
            (response: any) => {
              //console.log(response);
              this.bioTestDataFileNames = response[appConstants.RESPONSE];
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

  handleProjectTypeChange() {
    const projectType = this.projectForm.controls['projectType'].value;
    if (projectType == appConstants.SDK) {
      appConstants.SDK_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'sdkUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.ABIS_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
      });
      appConstants.SDK_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.ABIS_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.ABIS_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'abisUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.SDK_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
  }

  async saveProject() {
    appConstants.COMMON_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].markAsTouched();
    });
    this.projectForm.controls['projectType'].markAsTouched();
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`saveProject for type: ${projectType}`);
    if (projectType == appConstants.SDK) {
      appConstants.SDK_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.ABIS_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (this.projectForm.valid) {
      //Save the project in db
      console.log('valid');
      if (projectType == appConstants.SBI) {
        const projectData: SbiProjectModel = {
          name: this.projectForm.controls['name'].value,
          projectType: this.projectForm.controls['projectType'].value,
          sbiVersion: this.projectForm.controls['sbiSpecVersion'].value,
          purpose: this.projectForm.controls['sbiPurpose'].value,
          deviceType: this.projectForm.controls['deviceType'].value,
          deviceSubType: this.projectForm.controls['deviceSubType'].value,
        };
        let request = {
          id: appConstants.SBI_PROJECT_ADD_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: projectData,
        };
        this.dataLoaded = false;
        this.dataSubmitted = true;
        await this.addSbiProject(request);
      }
      if (projectType == appConstants.SDK) {
        const projectData: SdkProjectModel = {
          id: '',
          name: this.projectForm.controls['name'].value,
          projectType: this.projectForm.controls['projectType'].value,
          sdkVersion: this.projectForm.controls['sdkSpecVersion'].value,
          purpose: this.projectForm.controls['sdkPurpose'].value,
          url: this.projectForm.controls['sdkUrl'].value,
          bioTestDataFileName: this.projectForm.controls['bioTestData'].value,
        };
        let request = {
          id: appConstants.SDK_PROJECT_ADD_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: projectData,
        };
        this.dataLoaded = false;
        this.dataSubmitted = true;
        await this.addSdkProject(request);
      }
    }
  }

  handleSbiPurposeChange() {
    console.log('handleSbiPurposeChange');
    this.projectForm.controls['deviceSubType'].setValue('');
  }

  async addSbiProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addSbiProject(request).subscribe(
          (response: any) => {
            console.log(response);
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              this.dataSubmitted = false;
              resolve(true);
              Utils.showErrorMessage(response.errors, this.dialog);
            } else {
              this.dataLoaded = true;
              const dialogRef = Utils.showSuccessMessage(
                'Project created successfully',
                this.dialog
              );
              dialogRef.afterClosed().subscribe((res) => {
                this.showDashboard();
              });
              resolve(true);
            }
          },
          (errors) => {
            this.dataLoaded = true;
            this.dataSubmitted = false;
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async addSdkProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addSdkProject(request).subscribe(
          (response: any) => {
            console.log(response);
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              this.dataSubmitted = false;
              resolve(true);
              Utils.showErrorMessage(response.errors, this.dialog);
            } else {
              this.dataLoaded = true;
              const dialogRef = Utils.showSuccessMessage(
                'Project created successfully',
                this.dialog
              );
              dialogRef.afterClosed().subscribe((res) => {
                this.showDashboard();
              });
              resolve(true);
            }
          },
          (errors) => {
            this.dataLoaded = true;
            this.dataSubmitted = false;
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  showDashboard() {
    this.router.navigate([`toolkit/dashboard`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
