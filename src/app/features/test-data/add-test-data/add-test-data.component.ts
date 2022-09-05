import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';

@Component({
  selector: 'app-add-test-data',
  templateUrl: './add-test-data.component.html',
  styleUrls: ['./add-test-data.component.css'],
})
export class AddTestDataComponent implements OnInit {
  projectForm = new FormGroup({});
  @ViewChild('fileUpload')
  allControls: string[];
  subscriptions: Subscription[] = [];
  hidePassword = true;
  dataLoaded = true;
  dataSubmitted = false;
  allowedFileTypes = this.appConfigService
    .getConfig()
    ['allowedFileTypes'].split(',');
  allowedFileNameLegth = this.appConfigService
    .getConfig()
    ['allowedFileNameLegth'].split(',');
  allowedFileSize = this.appConfigService
    .getConfig()
    ['allowedFileSize'].split(',');

  constructor(
    public authService: AuthService,
    private appConfigService: AppConfigService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.allControls = [...appConstants.TEST_DATA_CONTROLS];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(controlId, new FormControl(''));
      this.projectForm.controls[controlId].setValidators(Validators.required);
    });
  }

  async getSampleTestDataFile() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getDefaultBioTestData().subscribe(
          (response: any) => {
            //console.log(response);
            //this.bioTestDataFileNames = response[appConstants.RESPONSE];
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

  async saveProject() {
    this.allControls.forEach((controlId) => {
      this.projectForm.controls[controlId].markAsTouched();
    });
    if (this.projectForm.valid) {
      //Save the project in db
      console.log('valid');
      // if (projectType == appConstants.SBI) {
      //   const projectData: SbiProjectModel = {
      //     name: this.projectForm.controls['name'].value,
      //     projectType: this.projectForm.controls['projectType'].value,
      //     sbiVersion: this.projectForm.controls['sbiSpecVersion'].value,
      //     purpose: this.projectForm.controls['sbiPurpose'].value,
      //     deviceType: this.projectForm.controls['deviceType'].value,
      //     deviceSubType: this.projectForm.controls['deviceSubType'].value,
      //   };
      //   let request = {
      //     id: appConstants.SBI_PROJECT_ADD_ID,
      //     version: appConstants.VERSION,
      //     requesttime: new Date().toISOString(),
      //     request: projectData,
      //   };
      //   this.dataLoaded = false;
      //   this.dataSubmitted = true;
      //   await this.addSbiProject(request);
      // }
      // if (projectType == appConstants.SDK) {
      //   const projectData: SdkProjectModel = {
      //     id: '',
      //     name: this.projectForm.controls['name'].value,
      //     projectType: this.projectForm.controls['projectType'].value,
      //     sdkVersion: this.projectForm.controls['sdkSpecVersion'].value,
      //     purpose: this.projectForm.controls['sdkPurpose'].value,
      //     url: this.projectForm.controls['sdkUrl'].value,
      //     bioTestDataFileName: this.projectForm.controls['bioTestData'].value,
      //   };
      //   let request = {
      //     id: appConstants.SDK_PROJECT_ADD_ID,
      //     version: appConstants.VERSION,
      //     requesttime: new Date().toISOString(),
      //     request: projectData,
      //   };
      //   this.dataLoaded = false;
      //   this.dataSubmitted = true;
      //   await this.addSdkProject(request);
      // }
    }
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

  clickOnButton() {
    const el = document.getElementById('testdatafile');
    if (el) {
      el.click();
    }
  }

  handleFileInput(event: any) {
    const extensionRegex = new RegExp(
      "(?:" + this.allowedFileTypes.replace(/,/g, "|") + ")"
    );
    // const oldFileExtension = this.fileExtension;
    // this.fileExtension = event.target.files[0].name.substring(
    //   event.target.files[0].name.indexOf(".") + 1
    // );
    // this.fileExtension = this.fileExtension.toLowerCase();
    // let allowedFileUploaded: Boolean = false;
    // this.disableNavigation = true;
    // // if (event.target.files[0].type === file) {
    // if (extensionRegex.test(this.fileExtension)) {
    //   allowedFileUploaded = true;
    //   if (
    //     event.target.files[0].name.length <
    //     this.config.getConfigByKey(
    //       appConstants.CONFIG_KEYS
    //         .preregistration_document_alllowe_file_name_lenght
    //     )
    //   ) {
    //     if (
    //       event.target.files[0].size <
    //       this.config.getConfigByKey(
    //         appConstants.CONFIG_KEYS.preregistration_document_alllowe_file_size
    //       )
    //     ) {
    //       this.getBase64(event.target.files[0]).then((data) => {
    //         this.fileByteArray = data;
    //       });
    //       if (!this.documentType && !this.documentCategory) {
    //         this.setJsonString(docName, docCode, refNumber);
    //       }
    //       this.sendFile(event);
    //     } else {
    //       this.displayMessage(
    //         this.errorlabels.errorLabel,
    //         this.messagelabels.uploadDocuments.msg1
    //       );
    //       this.disableNavigation = false;
    //     }
    //   } else {
    //     this.displayMessage(
    //       this.errorlabels.errorLabel,
    //       this.messagelabels.uploadDocuments.msg5
    //     );
    //     this.disableNavigation = false;
    //   }
    //   this.fileExtension = oldFileExtension;
    // }
    // if (!allowedFileUploaded) {
    //   this.fileExtension = oldFileExtension;
    //   this.displayMessage(
    //     this.errorlabels.errorLabel,
    //     this.messagelabels.uploadDocuments.msg3
    //   );
    //   this.disableNavigation = false;
    // }
  }

  showDashboard() {
    this.router.navigate([`toolkit/dashboard`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
