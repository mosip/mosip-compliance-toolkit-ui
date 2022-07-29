import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../../../core/components/dialog/dialog.component';

@Component({
  selector: 'app-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
})
export class AddProjectComponent implements OnInit {
  projectForm = new FormGroup({});
  allControls: string[];
  subscriptions: Subscription[] = [];
  hidePassword = true;
  dataLoaded = true;
  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.allControls = [
      ...appConstants.commonControls,
      ...appConstants.sbiControls,
      ...appConstants.sdkControls,
      ...appConstants.abisControls,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(controlId, new FormControl(''));
    });
    appConstants.commonControls.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
    });
  }

  handleProjectTypeChange() {
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`selected project type: ${projectType}`);
    if (projectType == appConstants.SDK) {
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'sdkUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
      });
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.abisControls.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
        if (controlId == 'abisUrl') {
          this.projectForm.controls[controlId].setValidators([
            Validators.required,
            Validators.pattern('^(http|https)://(.*)'),
          ]);
        }
      });
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].clearValidators();
        this.projectForm.controls[controlId].updateValueAndValidity();
      });
    }
  }

  async saveProject() {
    appConstants.commonControls.forEach((controlId) => {
      this.projectForm.controls[controlId].markAsTouched();
    });
    this.projectForm.controls['projectType'].markAsTouched();
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`saveProject for type: ${projectType}`);
    if (projectType == appConstants.SDK) {
      appConstants.sdkControls.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.SBI) {
      appConstants.sbiControls.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.ABIS) {
      appConstants.abisControls.forEach((controlId) => {
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
        await this.addSbiProject(request);
      }
    }
  }

  handleSbiPurposeChange() {
    console.log("handleSbiPurposeChange");
    this.projectForm.controls['deviceSubType'].setValue("");
  }

  async addSbiProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addSbiProject(request).subscribe(
          (response: any) => {
            console.log(response);
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              resolve(true);
              this.showErrorMessage(response.errors);
            } else {
              this.dataLoaded = true;
              this.showSuccessMessage();
              resolve(true);
            }
          },
          (error) => {
            this.dataLoaded = true;
            this.showErrorMessage(error);
            resolve(false);
          }
        )
      );
    });
  }

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

  private showSuccessMessage() {
    const title = 'Success';
    const message = 'Project created successfully';
    const body = {
      case: 'SUCCESS',
      title: title,
      message: message,
    };
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    dialogRef.afterClosed().subscribe((res) => {
      this.showDashboard();
    });
  }

  showDashboard() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([`toolkit/dashboard`]);
    } else {
      this.router.navigate([``]);
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
