import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbService } from 'xng-breadcrumb';
import { MatTableDataSource } from '@angular/material/table';
import { TestCaseModel } from 'src/app/core/models/testcase';
import { SelectionModel } from '@angular/cdk/collections';
import Utils from 'src/app/app.utils';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { environment } from 'src/environments/environment';
import { AbisProjectModel } from 'src/app/core/models/abis-project';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { error } from 'console';

@Component({
  selector: 'app-add-collections',
  templateUrl: './add-collections.component.html',
  styleUrls: ['./add-collections.component.css'],
})
export class AddCollectionsComponent implements OnInit {
  projectId: string;
  projectType: string;
  collectionForm = new FormGroup({});
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  dataSource: MatTableDataSource<TestCaseModel>;
  selection = new SelectionModel<TestCaseModel>(true, []);
  displayedColumns: string[] = [
    'actions',
    'testId',
    'testName',
    'testDescription',
    'validatorDefs',
    'scrollIcon',
  ];
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  dataSubmitted = false;
  textDirection: any = this.userProfileService.getTextDirection();
  resourceBundleJson: any = {};
  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.initForm();
    await this.initProjectIdAndType();
    if (this.projectType == appConstants.SBI) {
      const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId,this.dataService,this.resourceBundleJson,this.dialog);
      if(sbiProjectDetails) {
        this.sbiProjectData = sbiProjectDetails;
      }
      await this.getSbiTestcases();
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        this.sbiProjectData, null, null, this.projectType, null);
    }
    if (this.projectType == appConstants.SDK) {
      await this.getSdkProjectDetails();
      await this.getSdkTestcases();
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        null, this.sdkProjectData, null, this.projectType, null);
    }
    if (this.projectType == appConstants.ABIS) {
      await this.getAbisProjectDetails();
      await this.getAbisTestcases();
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        null, null, this.abisProjectData, this.projectType, null);
    }
    this.dataLoaded = true;
  }

  initForm() {
    this.collectionForm.addControl(
      'name',
      new FormControl('', [Validators.required])
    );
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

  async getSdkProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSdkProject(this.projectId).subscribe(
          (response: any) => {
            this.sdkProjectData = response['response'];
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

  async getAbisProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getAbisProject(this.projectId).subscribe(
          (response: any) => {
            this.abisProjectData = response['response'];
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

  async getSbiTestcases() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getSbiTestCases(
            this.sbiProjectData.sbiVersion,
            this.sbiProjectData.purpose,
            this.sbiProjectData.deviceType,
            this.sbiProjectData.deviceSubType
          )
          .subscribe(
            (response: any) => {
              this.processTestcasesResp(response);
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

  async getSdkTestcases() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getSdkTestCases(
            this.sdkProjectData.sdkVersion,
            this.sdkProjectData.purpose
          )
          .subscribe(
            (response: any) => {
              this.processTestcasesResp(response);
              resolve(true);
            },
            (errors: any) => {
              Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
              resolve(false);
            }
          )
      );
    });
  }

  async getAbisTestcases() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .getAbisTestCases(
            this.abisProjectData.abisVersion
          )
          .subscribe(
            (response: any) => {
              this.processTestcasesResp(response);
              resolve(true);
            },
            (errors: any) => {
              Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
              resolve(false);
            }
          )
      );
    });
  }

  processTestcasesResp(response: any) {
    let testcases = response['response'];
    let testcaseArr = [];
    if (testcases && testcases.length > 0) {
      for (let testcase of testcases) {
        if (!this.isAndroidAppMode) {
          testcaseArr.push(Utils.translateTestcase(testcase, this.resourceBundleJson));
        } else if (this.isAndroidAppMode && (!testcase.inactiveForAndroid
          || (testcase.inactiveForAndroid && testcase.inactiveForAndroid != "yes"))) {
          testcaseArr.push(Utils.translateTestcase(testcase, this.resourceBundleJson));
        }
      }
      //sort the testcases based on the testId
      testcaseArr.sort(function (a: TestCaseModel, b: TestCaseModel) {
        if (a.testId > b.testId) return 1;
        if (a.testId < b.testId) return -1;
        return 0;
      });
    }
    this.dataSource = new MatTableDataSource(testcaseArr);
  }
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    if (this.dataSource) {
      const numSelected = this.selection.selected.length;
      const numRows = this.dataSource.data.length;
      return numSelected === numRows;
    } else {
      return false;
    }
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: TestCaseModel): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.testId + 1
      }`;
  }

  async backToProject() {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }

  async saveCollection() {
    this.collectionForm.controls['name'].markAsTouched();
    const collectionName = this.collectionForm.controls['name'].value;
    if (collectionName.trim().length === 0) {
      this.collectionForm.controls['name'].setValue(null);
    } else {
      this.collectionForm.controls['name'].setValue(collectionName);
    }
    if (this.collectionForm.valid) {
      if (this.selection.isEmpty()) {
        const err = {
          errorCode: 'TESTCASE_001',
          message: 'Please select ateleast one testcase.',
        };
        Utils.showErrorMessage(this.resourceBundleJson, [err], this.dialog);
      } else {
        this.dataLoaded = false;
        this.dataSubmitted = true;
        const collectionData = {
          projectType: this.projectType,
          projectId: this.projectId,
          collectionName: this.collectionForm.controls['name'].value,
        };
        let request = {
          id: appConstants.COLLECTION_ADD_ID,
          version: appConstants.VERSION,
          requesttime: new Date().toISOString(),
          request: collectionData,
        };
        this.dataLoaded = false;
        this.dataSubmitted = true;
        let collectionResp: any = await this.addCollection(request);
        if (collectionResp && collectionResp['response']) {
          const collectionId = collectionResp['response']['collectionId'];
          let selectedTestcaseArr: object[] = [];
          this.dataSource.data.forEach((row: TestCaseModel) => {
            if (this.selection.isSelected(row)) {
              selectedTestcaseArr.push({
                collectionId: collectionId,
                testCaseId: row.testId,
              });
            }
          });

          let request1 = {
            id: appConstants.COLLECTION_TESTCASES_ADD_ID,
            version: appConstants.VERSION,
            requesttime: new Date().toISOString(),
            request: selectedTestcaseArr,
          };
          console.log(request1);
          await this.addTestcasesForCollection(request1);
        }
      }
    }
  }
  async addCollection(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addCollection(request).subscribe(
          (response: any) => {
            console.log(response);
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              this.dataSubmitted = false;
              resolve(true);
              Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog);
            } else {
              resolve(response);
            }
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

  async addTestcasesForCollection(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addTestcasesForCollection(request).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              this.dataSubmitted = false;
              resolve(true);
              Utils.showErrorMessage(this.resourceBundleJson, response.errors, this.dialog);
            } else {
              let resourceBundle = this.resourceBundleJson.dialogMessages;
              let successMsg = 'success';
              let collectionMsg = 'collectionSuccessMessage';
              this.dataLoaded = true;
              const dialogRef = Utils.showSuccessMessage(
                resourceBundle,
                successMsg,
                collectionMsg,
                this.dialog
              );
              dialogRef.afterClosed().subscribe((res) => {
                this.backToProject()
                  .catch((error) => {
                    console.log(error);
                  });
              });
              resolve(response);
            }
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
}
