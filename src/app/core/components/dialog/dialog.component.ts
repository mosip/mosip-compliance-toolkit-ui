import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { DataService } from '../../services/data-service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from '../../services/user-profile.service';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import * as appConstants from 'src/app/app.constants';
import { Router } from '@angular/router';
import { Subscription, flatMap } from 'rxjs';
import Utils from 'src/app/app.utils';
import { AppConfigService } from 'src/app/app-config.service';
import { LogoutService } from '../../services/logout.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
})
export class DialogComponent implements OnInit {
  input: any;
  panelOpenState = false;
  projectId: string;
  projectType: string;
  projectForm = new FormGroup({});
  projectFormData: any;
  allControls: string[];
  subscriptions: Subscription[] = [];
  resourceBundleJson: any = {};
  dataLoaded = false;
  selectedImages: (File | undefined)[] = [undefined, undefined, undefined, undefined];
  progress = 0;
  deviceImage1: string = '';
  deviceImage2: string = '';
  deviceImage3: string = '';
  deviceImage4: string = '';
  deviceImage5: string = '';
  imageUrls: any[] = [null, null, null, null];
  imagePreviewsVisible: boolean[] = [false, false, false, false];
  visibilityState: boolean[] = [false, false, false, false];
  imageSelected: boolean[] = [true, false, false, false];
  allowedFileNameLegth =
    this.appConfigService.getConfig()['allowedFileNameLegth'];
  allowedFileSize = this.appConfigService.getConfig()['allowedFileSize'];
  sendForReview: boolean = false;
  reviewComment: string = '';
  approveReport: boolean = false;
  adminApproveComments: string = '';
  adminRejectComments: string = '';
  rejectReport: boolean = false;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  consentResponse: any;
  consentTemplate: String;
  consentCheckbox: false;

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private appConfigService: AppConfigService,
    private dataService: DataService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private userProfileService: UserProfileService,
    private logoutservice: LogoutService
    ) {
    dialogRef.disableClose = true;

  }
  textDirection: any = this.userProfileService.getTextDirection();
  public closeMe() {
    this.dialogRef.close(true);
  }

  async ngOnInit(): Promise<void> {
    this.input = this.data;
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.projectId = this.input.id;
    this.projectType = this.input.projectType;
    if(this.projectId) {
      if (this.projectType == appConstants.SBI) {
        this.initSbiProjectForm();
        this.projectFormData = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        Utils.populateSbiProjectForm(this.projectFormData, this.projectForm);
      }
      if (this.projectType == appConstants.SDK) {
        this.initSdkProjectForm();
        this.projectFormData = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        Utils.populateSdkProjectForm(this.projectFormData, this.projectForm);
      }
      if (this.projectType == appConstants.ABIS) {
        this.initAbisProjectForm();
        this.projectFormData = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        Utils.populateAbisProjectForm(this.projectFormData, this.projectForm);
      }
    }
    if (this.data.selectedDeviceImagesUrl) {
      this.imageUrls = this.data.selectedDeviceImagesUrl;
      this.getSelectedImageUrl();
    }
    await this.getBiometricConsentTemplate();
    this.dataLoaded = true;
  }

  initSbiProjectForm() {
    this.allControls = [
      ...appConstants.COMMON_CONTROLS,
      ...appConstants.SBI_CONTROLS,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(
        controlId,
        new FormControl({
          value: '',
          disabled:
            controlId == 'sbiHash' || controlId == 'websiteUrl' ? false : true,
        })
      );
    });
    appConstants.SBI_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
      if (controlId == 'sbiHash' || controlId == 'websiteUrl') {
        this.projectForm.controls[controlId].setValidators([
          Validators.required,
          this.toBeAddedPatternValidator,
        ]);
      }
    });
  }

  initSdkProjectForm() {
    this.allControls = [
      ...appConstants.COMMON_CONTROLS,
      ...appConstants.SDK_CONTROLS,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(
        controlId,
        new FormControl({
          value: '',
          disabled:
            controlId == 'sdkHash' || controlId == 'websiteUrl' ? false : true,
        })
      );
    });
    appConstants.SDK_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
      if (controlId == 'sdkHash' || controlId == 'websiteUrl') {
        this.projectForm.controls[controlId].setValidators([
          Validators.required,
          this.toBeAddedPatternValidator,
        ]);
      }
    });
  }

  initAbisProjectForm() {
    this.allControls = [
      ...appConstants.COMMON_CONTROLS,
      ...appConstants.ABIS_CONTROLS,
    ];
    this.allControls.forEach((controlId) => {
      this.projectForm.addControl(
        controlId,
        new FormControl({
          value: '',
          disabled:
            controlId == 'abisHash' || controlId == 'websiteUrl' ? false : true,
        })
      );
    });
    appConstants.ABIS_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].setValidators(Validators.required);
      if (controlId == 'abisHash' || controlId == 'websiteUrl') {
        this.projectForm.controls[controlId].setValidators([
          Validators.required,
          this.toBeAddedPatternValidator,
        ]);
      }
    });
  }

  //Function for 'To_Be_Added' pattern
  toBeAddedPatternValidator(control: AbstractControl): ValidationErrors | null {
    const pattern = /^To_Be_Added$/;
    const value = control.value;
    return pattern.test(value) ? { toBeAddedPattern: true } : null;
  }

  async updateProject() {
    const projectType = this.projectForm.controls['projectType'].value;
    console.log(`updateProject for type: ${projectType}`);
    if (projectType == appConstants.SBI) {
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
    }
    if (projectType == appConstants.SDK) {
      appConstants.SDK_CONTROLS.forEach((controlId) => {
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
        let request = {
          id: appConstants.SBI_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: Utils.populateSbiProjectData(this.projectForm, this.projectFormData.id, 
            this.deviceImage1, this.deviceImage2, this.deviceImage3, this.deviceImage4, 
            this.isAndroidAppMode),
        };
        await this.updateSbiProject(request);
      }
      if (projectType == appConstants.SDK) {
        let request = {
          id: appConstants.SDK_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: Utils.populateSdkProjectData(this.projectForm, this.projectFormData.id),
        };
        await Utils.updateSdkProject(this.subscriptions, this.dataService, request, this.resourceBundleJson, this.dialog);
      }
      if (projectType == appConstants.ABIS) {
        let request = {
          id: appConstants.ABIS_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: Utils.populateAbisProjectData(this.projectForm, this.projectFormData.id),
        };
        await Utils.updateAbisProject(this.subscriptions, this.dataService, request, this.resourceBundleJson, this.dialog);
      }
      await this.saveProject()
    }
  }

  async updateSbiProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.updateSbiProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(Utils.getProjectResponse(response, this.resourceBundleJson, this.dialog));
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async saveProject() {
    this.dialogRef.close('');
    await this.router.navigate([`toolkit/project/${this.projectType}/${this.projectId}`]);
  }

  getImageBase64Urls(base64Urls: string[]) {
    return base64Urls.length == 0 ? 'There are no device images for this project' : '';
  }

  onFileSelect(event: Event, fileIndex: number): void {
    this.imagePreviewsVisible = [false, false, false, false];
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          Utils.showErrorMessage(
            this.resourceBundleJson,
            null,
            this.dialog,
            'File type is not allowed other than image'
          );
        } else if (file.name.includes('.') && file.name.split('.').length > 2) {
          Utils.showErrorMessage(
            this.resourceBundleJson,
            null,
            this.dialog,
            'File name should not contain multiple extensions',
            false,
            'FILE_WITH_MULTIPLE_EXTENSIONS'
          );
        } else {
          if (file.name.length > this.allowedFileNameLegth) {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              null,
              this.dialog,
              'File name is not allowed more than: ' +
              this.allowedFileNameLegth +
              ' characters'
            );
          } else {
            if (file.size > this.allowedFileSize) {
              let size = this.allowedFileSize / 1000000;
              Utils.showErrorMessage(
                this.resourceBundleJson,
                null,
                this.dialog,
                'File size is not allowed more than: ' + size + ' MB'
              );
            } else {
              this.selectedImages[fileIndex] = file;
              this.visibilityState[fileIndex] = true;
              this.imagePreviewsVisible[fileIndex] = true;
              if (fileIndex < 3) {
                this.imageSelected[fileIndex + 1] = true;
              }
            }
          }
        }
      }
    }
    this.loadPreviewImages(fileIndex);
  }

  getSelectedImageUrl() {
    const isAllUrlNull = this.imageUrls.every((value) => value == null);
    if (!isAllUrlNull) {
      this.imageSelected = [true, true, true, true];
      for (let i = 0; i < this.imageUrls.length; i++) {
        if (this.imageUrls[i]) {
          this.visibilityState[i] = true;
        }
      }
    } else {
      this.imageSelected = [true, false, false, false];
    }
  }

  loadPreviewImages(fileIndex: number): void {
    for (let i = 0; i < this.selectedImages.length; i++) {
      const image = this.selectedImages[i];
      if (image) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => {
          if (i == fileIndex) {
            this.imageUrls[fileIndex] = reader.result as string;
          }
        };
      }
    }
  }

  toggleImagePreview(fileIndex: number): void {
    for (let i = 0; i < this.imagePreviewsVisible.length; i++) {
      this.imagePreviewsVisible[i] = (i == fileIndex);
    }
  }

  deleteImage(fileIndex: number) {
    this.selectedImages[fileIndex] = undefined;
    this.imageUrls[fileIndex] = null;
    this.visibilityState[fileIndex] = false;
    this.imagePreviewsVisible[fileIndex] = false;
    console.log(this.imageUrls);
  }

  uploadImages() {
    this.dialogRef.close(this.imageUrls);
  }

  clickOnButton() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '450px',
      height: '360px',
      data: {
        case: "UPLOAD_DEVICE_IMAGES",
        selectedDeviceImagesUrl: this.imageUrls,
      },
    });
    dialogRef.afterClosed().subscribe((base64Url: string[]) => {
      if (base64Url && base64Url.length > 0) {
        this.deviceImage1 = base64Url[0];
        this.deviceImage2 = base64Url[1];
        this.deviceImage3 = base64Url[2];
        this.deviceImage4 = base64Url[3];
      }
      this.imageUrls = base64Url;
    });
  }

  submitReportForReview(reviewComment: string) {
    let newRequest = {
      ...this.input.reviewRequest,
      partnerComments: reviewComment
    }
    let submitRequest = {
      id: appConstants.PARTNER_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: newRequest
    };
    const subs = this.dataService.submitReportForReview(submitRequest).subscribe(
      (res: any) => {
        this.dataLoaded = true;
        if (res) {
          this.closeMe();
          window.location.reload();
        } else {
          Utils.showErrorMessage(this.resourceBundleJson,
            null,
            this.dialog,
            'Unable to submit report for review. Try Again!');
        }
      },
      (errors) => {
        Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
      }
    );
    this.subscriptions.push(subs);
  }
  approvePartnerReport(adminApproveComments: String) {
    let newRequest = {
      ...this.input.approveRequest,
      adminComments: adminApproveComments
    }
    let approveRequest = {
      id: appConstants.ADMIN_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: newRequest
    };
    const subs = this.dataService.approvePartnerReport(this.input.partnerId, approveRequest).subscribe(
      (res: any) => {
        this.dataLoaded = true;
        if (res) {
          this.dialogRef.close(false);
        } else {
          Utils.showErrorMessage(this.resourceBundleJson,
            null,
            this.dialog,
            'Unable to approve report. Try Again!');
        }
      },
      (errors) => {
        Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
      }
    );
    this.subscriptions.push(subs);
  }
  rejectPartnerReport(adminRejectComments: String) {
    let newRequest = {
      ...this.input.rejectRequest,
      adminComments: adminRejectComments
    }
    let rejectRequest = {
      id: appConstants.ADMIN_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: newRequest
    };
    const subs = this.dataService.rejectPartnerReport(this.input.partnerId, rejectRequest).subscribe(
      (res: any) => {
        this.dataLoaded = true;
        if (res) {
          this.dialogRef.close(false);
        } else {
          Utils.showErrorMessage(this.resourceBundleJson,
            null,
            this.dialog,
            'Unable to reject report. Try Again!');
        }
      },
      (errors) => {
        Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
      }
    );
    this.subscriptions.push(subs);
  }

  checkHashAndWebsiteUrl() {
    this.dialogRef.close(false);
  }

  // Close the dialog when the user clicks on the "OK" button, and initiate the logout process.
  onOkClick(): void {
    this.dialogRef.close();
    this.logoutservice.logout();
  }

  getBiometricConsentTemplate() {
    return new Promise((resolve, reject) => {
      const subscription = this.dataService.getBiometricConsentTemplate().subscribe(
        (response: any) => {
          this.consentTemplate = response['response'];
          resolve(true);
        },
        (errors: any) => {
          console.error('Failed to fetch template:', errors);
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
          resolve(false);
        }
      );
      this.subscriptions.push(subscription);
    });
  }
  

  saveBiometricConsent(consentForSbiBiometrics: boolean) {
    const consentRequest = {
      consentForSdkAbisBiometrics: consentForSbiBiometrics ? 'NO' : 'YES',
      consentForSbiBiometrics: consentForSbiBiometrics ? 'YES' : 'NO'
    };

    const reqBody = {
      id: appConstants.BIOMETRICS_CONSENT_DATA_ADD_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: consentRequest
    };

    return new Promise((resolve, reject) => {
      const subscription = this.dataService.saveBiometricConsent(reqBody).subscribe(
        (response: any) => {
          this.dialogRef.close();
          if (response.errors && response.errors.length > 0) {
            Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog);
            this.dataLoaded = true;
            resolve(true);
          } else {
            this.dataLoaded = true;
            const msg = 'addConsentDataSuccessMsg';
            const resourceBundle = this.resourceBundleJson.dialogMessages;
            const successMsg = 'success';
            Utils.showSuccessMessage(resourceBundle, successMsg, msg, this.dialog);
            resolve(true);
          }
        },
        (errors) => {
          this.dialogRef.close();
          Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
          resolve(false);
        }
      );
      this.subscriptions.push(subscription);
    });
  }

}
