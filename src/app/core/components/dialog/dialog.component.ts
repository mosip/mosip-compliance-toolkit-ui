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
import { SbiProjectModel } from '../../models/sbi-project';
import { AbisProjectModel } from '../../models/abis-project';
import { SdkProjectModel } from '../../models/sdk-project';
import { AppConfigService } from 'src/app/app-config.service';

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
  updatingAttribute: string;
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

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private appConfigService: AppConfigService,
    private dataService: DataService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private userProfileService: UserProfileService
  ) {
    dialogRef.disableClose = true;
    
  }
  textDirection: any = this.userProfileService.getTextDirection();
  public closeMe() {
    this.dialogRef.close();
  }

  async ngOnInit(): Promise<void> {
    this.input = this.data;
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.projectId = this.input.id;
    this.projectType = this.input.projectType;
    if(this.projectType == appConstants.SBI) {
      this.initSbiProjectForm();
      this.projectFormData = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      this.populateSbiProjectForm();
    }
    if (this.projectType == appConstants.SDK) {
      this.initSdkProjectForm();
      this.projectFormData = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      this.populateSdkProjectForm();
    }
    if (this.projectType == appConstants.ABIS) {
      this.initAbisProjectForm();
      await this.getAbisProjectDetails();
      this.populateAbisProjectForm();
    }
    if (this.data.selectedDeviceImagesUrl) {
      this.imageUrls = this.data.selectedDeviceImagesUrl;
      this.getSelectedImageUrl();
    }
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
            controlId == 'abisHash' || controlId == 'websiteUrl'  ? false : true,
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

  async getAbisProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getAbisProject(this.projectId).subscribe(
          (response: any) => {
            this.projectFormData = response['response'];
            resolve(true);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
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
      this.projectForm.controls['sbiHash'].setValue(
        this.projectFormData.sbiHash
      );
      this.projectForm.controls['websiteUrl'].setValue(
        this.projectFormData.websiteUrl
      );
    }
  }

  populateSdkProjectForm() {
    if (this.projectFormData) {
      this.projectForm.controls['name'].setValue(this.projectFormData.name);
      this.projectForm.controls['projectType'].setValue(appConstants.SDK);
      this.projectForm.controls['sdkUrl'].setValue(this.projectFormData.url);
      this.projectForm.controls['sdkSpecVersion'].setValue(
        this.projectFormData.sdkVersion
      );
      this.projectForm.controls['sdkPurpose'].setValue(
        this.projectFormData.purpose
      );
      this.projectForm.controls['sdkHash'].setValue(
        this.projectFormData.sdkHash
      );
      this.projectForm.controls['websiteUrl'].setValue(
        this.projectFormData.websiteUrl
      );
      this.projectForm.controls['bioTestData'].setValue(
        this.projectFormData.bioTestDataFileName
      );
    }
  }

  populateAbisProjectForm() {
    if (this.projectFormData) {
      this.projectForm.controls['name'].setValue(this.projectFormData.name);
      this.projectForm.controls['projectType'].setValue(appConstants.ABIS);
      this.projectForm.controls['abisUrl'].setValue(this.projectFormData.url);
      this.projectForm.controls['inboundQueueName'].setValue(this.projectFormData.inboundQueueName);
      this.projectForm.controls['outboundQueueName'].setValue(this.projectFormData.outboundQueueName);
      this.projectForm.controls['username'].setValue(this.projectFormData.username);
      this.projectForm.controls['password'].setValue(this.projectFormData.password);
      this.projectForm.controls['modality'].setValue(this.projectFormData.modality);
      this.projectForm.controls['abisSpecVersion'].setValue(
        this.projectFormData.abisVersion
      );
      this.projectForm.controls['abisHash'].setValue(
        this.projectFormData.abisHash
      );
      this.projectForm.controls['websiteUrl'].setValue(
        this.projectFormData.websiteUrl
      );
      this.projectForm.controls['abisBioTestData'].setValue(
        this.projectFormData.bioTestDataFileName
      );
    }
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
        const projectData: SbiProjectModel = {
          id: this.projectFormData.id,
          name: this.projectForm.controls['name'].value,
          projectType: this.projectForm.controls['projectType'].value,
          sbiVersion: this.projectForm.controls['sbiSpecVersion'].value,
          purpose: this.projectForm.controls['sbiPurpose'].value,
          deviceType: this.projectForm.controls['deviceType'].value,
          deviceSubType: this.projectForm.controls['deviceSubType'].value,
          deviceImage1: this.deviceImage1,
          deviceImage2: this.deviceImage2,
          deviceImage3: this.deviceImage3,
          deviceImage4: this.deviceImage4,
          sbiHash: this.projectForm.controls['sbiHash'].value,
          websiteUrl: this.projectForm.controls['websiteUrl'].value,
        };
        let request = {
          id: appConstants.SBI_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: projectData,
        };
        await this.updateSbiProject(request);
      }
      if (projectType == appConstants.SDK) {
        const projectData: SdkProjectModel = {
          id: this.projectFormData.id,
          name: this.projectForm.controls['name'].value,
          projectType: this.projectForm.controls['projectType'].value,
          sdkVersion: this.projectForm.controls['sdkSpecVersion'].value,
          purpose: this.projectForm.controls['sdkPurpose'].value,
          url: this.projectForm.controls['sdkUrl'].value,
          sdkHash: this.projectForm.controls['sdkHash'].value,
          websiteUrl: this.projectForm.controls['websiteUrl'].value,
          bioTestDataFileName: this.projectForm.controls['bioTestData'].value,
        };
        let request = {
          id: appConstants.SDK_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: projectData,
        };
        await this.updateSdkProject(request);
      }
      if (projectType == appConstants.ABIS) {
        const projectData: AbisProjectModel = {
          id: this.projectFormData.id,
          name: this.projectForm.controls['name'].value,
          projectType: this.projectForm.controls['projectType'].value,
          abisVersion: this.projectForm.controls['abisSpecVersion'].value,
          url: this.projectForm.controls['abisUrl'].value,
          username: this.projectForm.controls['username'].value,
          password: this.projectForm.controls['password'].value,
          outboundQueueName: this.projectForm.controls['outboundQueueName'].value,
          inboundQueueName: this.projectForm.controls['inboundQueueName'].value,
          modality:this.projectForm.controls['modality'].value,
          abisHash:this.projectForm.controls['abisHash'].value,
          websiteUrl:this.projectForm.controls['websiteUrl'].value,
          bioTestDataFileName: this.projectForm.controls['abisBioTestData'].value,
        };
        let request = {
          id: appConstants.ABIS_PROJECT_UPDATE_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: projectData,
        };
        await this.updateAbisProject(request);
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
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.updatingAttribute = '';
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async updateSdkProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.updateSdkProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.updatingAttribute = '';
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async updateAbisProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.updateAbisProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.updatingAttribute = '';
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  getProjectResponse(response: any){
    if (response.errors && response.errors.length > 0) {
      this.updatingAttribute = '';
      Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog);
      return true;
    } else {
      this.updatingAttribute = '';
      this.panelOpenState = true;
      return true;
    }
  }

  async saveProject() {
    this.dialogRef.close('');
    await this.router.navigate([`toolkit/project/${this.projectType}/${this.projectId}`]);
  }

  getImageBase64Urls(base64Urls: string[]) {
    return base64Urls.length == 0 ? 'There are no device images for this project': '';
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

  getSelectedImageUrl(){
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
}
