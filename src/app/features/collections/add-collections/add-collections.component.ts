import { Component, OnInit, ViewChild } from '@angular/core';
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
    this.dataService.getResourceBundle(this.userProfileService.getUserPreferredLanguage()).subscribe(
      (response: any) => {
        this.resourceBundleJson = response;
      }
    );
    this.initForm();
    await this.initProjectIdAndType();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
      await this.getSbiTestcases();
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.SDK) {
      await this.getSdkProjectDetails();
      await this.getSdkTestcases();
      this.initBreadCrumb();
    }
    if (this.projectType == appConstants.ABIS) {
      await this.getAbisProjectDetails();
      await this.getAbisTestcases();
      this.initBreadCrumb();
    }
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
    if (this.sbiProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} ${breadcrumbLabels.project} - ${this.sbiProjectData.name}`
      );
    }
    if (this.sdkProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} ${breadcrumbLabels.project} - ${this.sdkProjectData.name}`
      );
    }
    if (this.abisProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} ${breadcrumbLabels.project} - ${this.abisProjectData.name}`
      );
    }
    this.breadcrumbService.set('@collectionBreadCrumb', `${breadcrumbLabels.add}`);
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

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(this.projectId).subscribe(
          (response: any) => {
            console.log(response);
            this.sbiProjectData = response['response'];
            console.log(this.sbiProjectData);
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

  async getSdkProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSdkProject(this.projectId).subscribe(
          (response: any) => {
            //console.log(response);
            this.sdkProjectData = response['response'];
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

  async getAbisProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getAbisProject(this.projectId).subscribe(
          (response: any) => {
            //console.log(response);
            this.abisProjectData = response['response'];
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
              //console.log(response);
              this.processTestcasesResp(response);
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
              //console.log(response);
              this.processTestcasesResp(response);
              resolve(true);
            },
            (errors: any) => {
              Utils.showErrorMessage(errors, this.dialog);
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
              //console.log(response);
              this.processTestcasesResp(response);
              resolve(true);
            },
            (errors: any) => {
              Utils.showErrorMessage(errors, this.dialog);
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
      //console.log(testcaseArr);
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

  backToProject() {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }

  async saveCollection() {
    this.collectionForm.controls['name'].markAsTouched();
    if (this.collectionForm.valid) {
      if (this.selection.isEmpty()) {
        const err = {
          errorCode: '',
          message: 'Please select ateleast one testcase.',
        };
        Utils.showErrorMessage([err], this.dialog);
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
        if (collectionResp) {
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
              Utils.showErrorMessage(response.errors, this.dialog);
            } else {
              resolve(response);
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

  async addTestcasesForCollection(request: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addTestcasesForCollection(request).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.dataLoaded = true;
              this.dataSubmitted = false;
              resolve(true);
              Utils.showErrorMessage(response.errors, this.dialog);
            } else {
              this.dataLoaded = true;
              const dialogRef = Utils.showSuccessMessage(
                'Collection created successfully',
                this.dialog
              );
              dialogRef.afterClosed().subscribe((res) => {
                this.backToProject();
              });
              resolve(response);
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
}
