import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { BreadcrumbService } from 'xng-breadcrumb';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';

@Component({
  selector: 'app-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
})
export class AddProjectComponent implements OnInit {
  resourceBundleJson: any = {};
  projectForm = new FormGroup({});
  allControls: string[];
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : {'float': 'right'};
  subscriptions: Subscription[] = [];
  bioTestDataFileNames: string[] = [];
  hidePassword = true;
  dataLoaded = false;
  dataSubmitted = false;
  isAbisPartner = this.appConfigService.getConfig()['isAbisPartner'] == "YES" ? true : false;
  abisOptionTitle: string = '';
  deviceImage1: any = null;
  deviceImage2: any = null;
  deviceImage3: any = null;
  deviceImage4: any = null;
  deviceImage5: any = null;
  imageUrls: any[] = [null, null, null, null];

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private appConfigService: AppConfigService,
    private dialog: MatDialog,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private userProfileService: UserProfileService,
    private translate:TranslateService
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.abisOptionTitle = this.isAbisPartner
      ? ''
      : this.resourceBundleJson.addProject['abisOptionTitle'];
    this.initForm();
    this.initBreadCrumb();
    const projectType = this.projectForm.controls['projectType'].value;
    if (projectType == appConstants.SDK) {
      this.bioTestDataFileNames = await Utils.getBioTestDataNames(this.subscriptions, this.dataService, this.projectForm.controls['sdkPurpose'].value, this.resourceBundleJson, this.dialog);
    }
    if (projectType == appConstants.ABIS) {
      this.bioTestDataFileNames = await Utils.getBioTestDataNames(this.subscriptions, this.dataService, appConstants.ABIS, this.resourceBundleJson, this.dialog);
    } 
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
      this.breadcrumbService.set('@addProjectBreadCrumb', `${breadcrumbLabels.addNewProject}`);
    }
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
    this.projectForm.patchValue({
      abisUrl: 'wss://{base_URL}/ws',
      outboundQueueName: 'ctk-to-abis',
      inboundQueueName: 'abis-to-ctk'
    });
  }

  async handleProjectTypeChange() {
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
            Validators.pattern('^(ws|wss)://.*\\/ws$'),
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
      this.bioTestDataFileNames = await Utils.getBioTestDataNames(this.subscriptions, this.dataService, appConstants.ABIS, this.resourceBundleJson, this.dialog);
    }
  }

  async handleSdkPurposeChange() {
    this.bioTestDataFileNames = await Utils.getBioTestDataNames(this.subscriptions, this.dataService, this.projectForm.controls['sdkPurpose'].value, this.resourceBundleJson, this.dialog);
  }

  async saveProject() {
    let hash = '';
    let websiteUrl = '';
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
      hash = this.projectForm.controls['sdkHash'].value;
      websiteUrl = this.projectForm.controls['websiteUrl'].value;
    }
    if (projectType == appConstants.SBI) {
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
      hash = this.projectForm.controls['sbiHash'].value;
      websiteUrl = this.projectForm.controls['websiteUrl'].value;
    }
    if (projectType == appConstants.ABIS) {
      appConstants.ABIS_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].markAsTouched();
      });
      hash = this.projectForm.controls['abisHash'].value;
      websiteUrl = this.projectForm.controls['websiteUrl'].value;
    }
    const projectName = this.projectForm.controls['name'].value;
    if (projectName.trim().length === 0) {
      this.projectForm.controls['name'].setValue(null);
    } else {
      this.projectForm.controls['name'].setValue(projectName.trim());
    }
    if (this.projectForm.valid) {
      //Save the project in db
      console.log('valid');
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '600px',
        data: {
          case: "ADD_PROJECT",
          hash: hash,
          websiteUrl: websiteUrl,
          projectType: projectType
        },
      });
      dialogRef.afterClosed().subscribe(
        (closeBtn: boolean) => {
          (async () => {
            if (!closeBtn) {
              if (projectType == appConstants.SBI) {
                let request = {
                  id: appConstants.SBI_PROJECT_ADD_ID,
                  version: appConstants.VERSION,
                  requesttime: new Date().toISOString(),
                  request: Utils.populateSbiProjectData(this.projectForm, '', this.deviceImage1, this.deviceImage2, 
                  this.deviceImage3, this.deviceImage4, this.isAndroidAppMode),
                };
                this.dataLoaded = false;
                this.dataSubmitted = true;
                await this.addSbiProject(request);
              }
              if (projectType == appConstants.SDK) {
                let request = {
                  id: appConstants.SDK_PROJECT_ADD_ID,
                  version: appConstants.VERSION,
                  requesttime: new Date().toISOString(),
                  request: Utils.populateSdkProjectData(this.projectForm, ''),
                };
                this.dataLoaded = false;
                this.dataSubmitted = true;
                await this.addSdkProject(request);
              }
              if (projectType == appConstants.ABIS) {
                let request = {
                  id: appConstants.ABIS_PROJECT_ADD_ID,
                  version: appConstants.VERSION,
                  requesttime: new Date().toISOString(),
                  request: Utils.populateAbisProjectData(this.projectForm, ''),
                };
                this.dataLoaded = false;
                this.dataSubmitted = true;
                await this.addAbisProject(request);
              }
            }
          })();
        }
      );
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
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.dataLoaded = true;
            this.dataSubmitted = false;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
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
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.dataLoaded = true;
            this.dataSubmitted = false;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async addAbisProject(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addAbisProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response));
          },
          (errors) => {
            this.dataLoaded = true;
            this.dataSubmitted = false;
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  getProjectResponse(response: any){
    this.dialog.closeAll();
    if (response.errors && response.errors.length > 0) {
      this.dataLoaded = true;
      this.dataSubmitted = false;
      Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog);
      return true;
    } else {
      let resourceBundle = this.resourceBundleJson.dialogMessages;
      let successMsg = 'success';
      let projectMsg = 'successMessage';
      this.dataLoaded = true;
      const dialogRef = Utils.showSuccessMessage(
        resourceBundle,
        successMsg,
        projectMsg,
        this.dialog
      );
      dialogRef.afterClosed().subscribe((res) => {
        this.showDashboard()
          .catch((error) => {
            console.log(error);
          });
      });
      return true;
    }
  }

  async showDashboard() {
    await this.router.navigate([`toolkit/dashboard`]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  clickOnButton() {
    this.projectForm.controls['name'].clearValidators();
    this.projectForm.controls['name'].updateValueAndValidity();
    appConstants.SBI_CONTROLS.forEach((controlId) => {
      this.projectForm.controls[controlId].clearValidators();
      this.projectForm.controls[controlId].updateValueAndValidity();
    });
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
      appConstants.SBI_CONTROLS.forEach((controlId) => {
        this.projectForm.controls[controlId].setValidators(Validators.required);
      });
    });
  }

}
