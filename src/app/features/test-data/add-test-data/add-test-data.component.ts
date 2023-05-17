import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-add-test-data',
  templateUrl: './add-test-data.component.html',
  styleUrls: ['./add-test-data.component.css'],
})
export class AddTestDataComponent implements OnInit {
  testDataForm = new FormGroup({});
  @ViewChild('fileUpload')
  fileInputVariable: ElementRef;
  allControls: string[];
  subscriptions: Subscription[] = [];
  hidePassword = true;
  dataLoaded = true;
  allowedFilesExtensions: string = '';
  fileExtension: string = 'zip';
  fileName: string = '';
  fileByteArray: any;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : null;
  resourceBundleJson: any = {};
  showSdkPurpose:boolean = true;
  allowedFileTypes = this.appConfigService
    .getConfig()
    ['allowedFileTypes'].split(',');
  allowedFileNameLegth =
    this.appConfigService.getConfig()['allowedFileNameLegth'];
  allowedFileSize = this.appConfigService.getConfig()['allowedFileSize'];

  constructor(
    public authService: AuthService,
    private appConfigService: AppConfigService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private breadcrumbService: BreadcrumbService,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.initForm();
    this.initBreadCrumb();
    this.getAllowedFileTypes(this.allowedFileTypes);
    this.dataService.getResourceBundle(this.userProfileService.getUserPreferredLanguage()).subscribe(
      (response: any) => {
        this.resourceBundleJson = response;
      }
    );
  }

  initBreadCrumb() {
    this.dataService.getResourceBundle(this.userProfileService.getUserPreferredLanguage()).subscribe(
      (response: any) => {
        const breadcrumbLabels = response['breadcrumb'];
        this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
        this.breadcrumbService.set('@uploadTestDataBreadCrumb', `${breadcrumbLabels.uploadBiometricTestData}`);
      }
    );
  }

  initForm() {
    this.allControls = [...appConstants.TEST_DATA_CONTROLS];
    this.allControls.forEach((controlId) => {
      this.testDataForm.addControl(controlId, new FormControl(''));
      this.testDataForm.controls[controlId].setValidators(Validators.required);
    });
    this.testDataForm.controls['type'].setValue('SDK');
  }

  getAllowedFileTypes(allowedFiles: string[]) {
    let i = 0;
    for (let file of allowedFiles) {
      if (i == 0) {
        this.allowedFilesExtensions =
          this.allowedFilesExtensions + file.substring(file.indexOf('/') + 1);
      } else {
        this.allowedFilesExtensions =
          this.allowedFilesExtensions +
          ',' +
          file.substring(file.indexOf('/') + 1);
      }
      i++;
    }
  }

  clickOnButton() {
    this.testDataForm.controls['name'].setValidators(Validators.required);
    this.testDataForm.controls['name'].updateValueAndValidity();
    this.allControls.forEach((controlId) => {
      this.testDataForm.controls[controlId].markAsTouched();
    });
    if (this.testDataForm.valid) {
      const el = document.getElementById('testdatafile');
      if (el) {
        el.click();
      }
    }
  }

  abisData(projectType: string) {
    if (projectType == appConstants.ABIS) {
      this.showSdkPurpose = false;
      this.testDataForm.controls['purpose'].setValidators(null);
      this.testDataForm.controls['purpose'].updateValueAndValidity();
      this.testDataForm.controls['purpose'].setValue(appConstants.ABIS);
    } else {
      this.showSdkPurpose = true;
      this.testDataForm.controls['purpose'].setValidators(Validators.required);
      this.testDataForm.controls['purpose'].updateValueAndValidity();
    }
  }

  showToolTip() {
    let title;
    let msg;
    let translatedMsgs = this.resourceBundleJson['addTestData'];
    translatedMsgs.title ? title = translatedMsgs.title : title;
    translatedMsgs.msg ? msg = translatedMsgs.msg : msg; 
    const body = {
      case: 'INFO',
      title: title,
      message: msg,
    };
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '600px',
      data: body,
    });
    dialogRef.disableClose = false;
  }

  handleFileInput(event: any) {
    this.allControls.forEach((controlId) => {
      this.testDataForm.controls[controlId].markAsTouched();
    });
    if (this.testDataForm.valid) {
      const extensionRegex = new RegExp(
        '(?:' + this.allowedFilesExtensions.replace(/,/g, '|') + ')'
      );
      const oldFileExtension = this.fileExtension;
      this.fileExtension = event.target.files[0].name.substring(
        event.target.files[0].name.indexOf('.') + 1
      );
      this.fileExtension = this.fileExtension.toLowerCase();
      if (!extensionRegex.test(this.fileExtension)) {
        this.fileExtension = oldFileExtension;
        Utils.showErrorMessage(
          this.resourceBundleJson,
          null,
          this.dialog,
          'File extension is not allowed other than: ' +
            this.allowedFilesExtensions
        );
      } else {
        if (event.target.files[0].name.length > this.allowedFileNameLegth) {
          Utils.showErrorMessage(
            this.resourceBundleJson,
            null,
            this.dialog,
            'File name is not allowed more than: ' +
              this.allowedFileNameLegth +
              ' characters'
          );
        } else {
          if (event.target.files[0].size > this.allowedFileSize) {
            let size = this.allowedFileSize / 1000000;
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'File size is not allowed more than: ' + size + ' MB'
            );
          } else {
            this.getBase64(event.target.files[0]).then((data) => {
              this.saveTestData(event);
            });
          }
        }
      }
    }
  }

  getBase64(file: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  getSampleBioTestDataFile() {
    this.testDataForm.controls['purpose'].markAsTouched();
    this.testDataForm.controls['name'].clearValidators();
    this.testDataForm.controls['name'].updateValueAndValidity();
    if (
      !(
        this.testDataForm.controls['purpose'].errors?.['required']
      )
    ) {
      const purpose = this.testDataForm.controls['purpose'].value;
      const subs = this.dataService.getSampleBioTestDataFile(purpose).subscribe(
        (res: any) => {
          if (res) {
            const fileByteArray = res;
            if (fileByteArray) {
              var blob = new Blob([fileByteArray], { type: 'application/zip' });
              var link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `SDK_Sample_Test_Data_${purpose.replace(
                ' ',
                '_'
              )}.zip`;
              link.click();
            }
          } else {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'Unable to download sample test data ZIP file. Try Again!'
            );
          }

        },
        (errors) => {
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
        }
      );
      this.subscriptions.push(subs);
    } 
  }

  async saveTestData(event: any) {
    this.allControls.forEach((controlId) => {
      this.testDataForm.controls[controlId].markAsTouched();
    });
    if (this.testDataForm.valid) {
      const testData = {
        name: this.testDataForm.controls['name'].value,
        type: this.testDataForm.controls['type'].value,
        purpose: this.testDataForm.controls['purpose'].value,
      };
      let request = {
        id: appConstants.BIOMETRICS_TEST_DATA_ADD_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        request: testData,
      };
      let formData = new FormData();
      formData.append('biometricMetaData', JSON.stringify(request));
      formData.append('file', event.target.files.item(0));
      this.dataLoaded = false;
      await this.addBiometricTestData(formData);
    }
  }

  async addBiometricTestData(formData: FormData) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addBiometricTestData(formData).subscribe(
          (response: any) => {
            console.log(response);
            if (response.errors && response.errors.length > 0) {
              Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog, '', false);
              this.dataLoaded = true;
              resolve(true);
            } else {
              this.dataLoaded = true;
              let info = '';
              if (response[appConstants.RESPONSE]) {
                info = response[appConstants.RESPONSE]['info'];
              }
              let msg = 'Test data added successfully. ';
              if (info) {
                msg += info;
              }
              let resourceBundle = this.resourceBundleJson.dialogMessages;
              let successMsg = 'success';
              const dialogRef = Utils.showSuccessMessage(resourceBundle, successMsg, msg, this.dialog);
              dialogRef.afterClosed().subscribe((res) => {
                this.showBiometricDashboard();
              });
              resolve(true);
            }
          },
          (errors) => {
            this.dataLoaded = true;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  showBiometricDashboard() {
    this.router.navigate([`toolkit/dashboard/biometric`]);
  }

  showDashboard() {
    this.router.navigate([`toolkit/dashboard`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
