import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AuthService } from '../../../core/services/authservice.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../core/services/data-service';
import * as appConstants from 'src/app/app.constants';
import { Subscription } from 'rxjs';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbService } from 'xng-breadcrumb';
import { MatTableDataSource } from '@angular/material/table';
import Utils from 'src/app/app.utils';
import { TestRunModel } from 'src/app/core/models/testrun';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { AbisProjectModel } from 'src/app/core/models/abis-project';
import { AppConfigService } from 'src/app/app-config.service';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';
import { environment } from 'src/environments/environment';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-test-run',
  templateUrl: './test-run.component.html',
  styleUrls: ['./test-run.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class TestRunComponent implements OnInit {
  collectionId: string;
  collectionName: string;
  collectionType: string;
  runId: string;
  projectId: string;
  projectType: string;
  partnerId: string;
  isAdmin = false;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  collectionForm = new FormGroup({});
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  showGenerateReportBtn = false;
  showSubmittedReportBtn = false;
  testcasesList: any;
  dataSource: MatTableDataSource<TestRunModel>;
  displayedColumns: string[] = ['testId', 'testName', 'resultStatus', 'executionStatus', 'scrollIcon'];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  expandedElement: TestRunModel | null;
  dataSubmitted = false;
  panelOpenState = false;
  runDetails: any;
  textDirection: any = this.userProfileService.getTextDirection();
  resourceBundleJson: any = {};
  langCode = this.userProfileService.getUserPreferredLanguage();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  
  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private appConfigService: AppConfigService
  ) { }

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    const adminRole = this.appConfigService.getConfig()['adminPartnerReportRole'];
    this.isAdmin = this.userProfileService.hasRole(adminRole);
    await this.initAllParams();
    if (!this.isAdmin && !this.partnerId) {
      const collectionRes = await Utils.getCollectionNameAndType(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
      this.collectionName = collectionRes.name;
      this.collectionType = collectionRes.type;
      if (this.projectType == appConstants.SBI) {
        const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        if (sbiProjectDetails) {
          this.sbiProjectData = sbiProjectDetails;
        }
      }
      if (this.projectType == appConstants.SDK) {
        const sdkProjectDetails: any = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        if (sdkProjectDetails) {
          this.sdkProjectData = sdkProjectDetails;
        }
      }
      if (this.projectType == appConstants.ABIS) {
        const abisProjectDetails: any = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        if (abisProjectDetails) {
          this.abisProjectData = abisProjectDetails;
        }
        this.initBreadCrumb();
      }
    }
    this.testcasesList = await Utils.getTestcasesForCollection(this.subscriptions, this.dataService,
      this.isAdmin, this.partnerId, this.collectionId, this.resourceBundleJson, this.dialog);
    await this.getTestRun();
    //enable download report button only for compliance collection
    if (appConstants.COMPLIANCE_COLLECTION == this.collectionType) {
      let isReportAlreadySubmitted = await Utils.isReportAlreadySubmitted(this.projectType, this.projectId, this.collectionId, this.dataService, this.resourceBundleJson, this.dialog);
      if (!isReportAlreadySubmitted) {
        this.showGenerateReportBtn = true;
      } else {
        this.showSubmittedReportBtn = true;
      }
    }
    this.initBreadCrumb();
    this.dataLoaded = true;
  }

  initAllParams() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectType = param['projectType'];
        this.projectId = param['projectId'];
        this.collectionId = param['collectionId'];
        this.runId = param['runId'];
        if (this.isAdmin) {
          this.partnerId = param['partnerId'];
          if (!this.partnerId) {
            this.isAdmin = false;
          }
        } else {
          this.partnerId = '';
        }
      });
      resolve(true);
    });
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService,
        this.sbiProjectData, this.sdkProjectData, this.abisProjectData,
        this.projectType, this.collectionName);
      if (this.runDetails) {
        let runStatus = this.runDetails.runStatus;
        if (runStatus == appConstants.SUCCESS) {
          runStatus = this.resourceBundleJson["viewTestRun"]["success"];
        }
        if (runStatus == appConstants.FAILURE) {
          runStatus = this.resourceBundleJson["viewTestRun"]["failure"];
        }
        let execStatus = this.runDetails.executionStatus;
        if (execStatus == appConstants.COMPLETE_STATUS) {
          execStatus = this.resourceBundleJson["viewTestRun"]["complete"];
        }
        if (execStatus == appConstants.INCOMPLETE_STATUS) {
          execStatus = this.resourceBundleJson["viewTestRun"]["incomplete"];
        }
        const runDetails = `${breadcrumbLabels.testRun} - (${new Date(this.runDetails.runDtimes).toLocaleString()} - ${runStatus} - ${execStatus})`;
        this.breadcrumbService.set(
          '@testrunBreadCrumb',
          runDetails
        );
      } else {
        this.breadcrumbService.set(
          '@testrunBreadCrumb',
          `${breadcrumbLabels.testRun}`
        );
      }

    }
  }

  async getTestRun() {

    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunDetails(this.isAdmin, this.partnerId, this.runId).subscribe(
          (response: any) => {
            this.runDetails = response['response'];
            let list: any[] = response['response']['testRunDetailsList'];
            let tableData = [];
            for (const testCase of this.testcasesList) {
              let testRunData = null;
              let matchFound = false;
              for (const testRun of list) {
                if (testRun.testcaseId == testCase.testId) {
                  matchFound = true;
                  testRunData = testRun;
                }
                if (testRunData) {
                  tableData.push({
                    testCaseType: testCase.testCaseType,
                    testName: testCase.testName,
                    testId: testCase.testId,
                    testDescription: testCase.testDescription,
                    methodId: testRunData && testRunData.methodId
                      ? testRunData.methodId
                      : '',
                    methodName: testRunData && testRunData.methodName
                      ? testRunData.methodName
                      : testCase.methodName,
                    methodRequest: testRunData && testRunData.methodRequest
                      ? testRunData.methodRequest
                      : appConstants.LOADING,
                    methodResponse: testRunData && testRunData.methodResponse
                      ? testRunData.methodResponse
                      : appConstants.LOADING,
                    resultStatus: testRunData && testRunData.resultStatus
                      ? testRunData.resultStatus
                      : appConstants.FAILURE,
                    resultDescription: testRunData && testRunData.resultDescription
                      ? testRunData.resultDescription
                      : appConstants.LOADING,
                    testDataSource:
                      testRunData && testRunData.testDataSource
                        ? testRunData.testDataSource
                        : '',
                    methodUrl:
                      testRunData && testRunData.methodUrl
                        ? testRunData.methodUrl
                        : '',
                    executionStatus:
                      testRunData && testRunData.executionStatus
                        ? testRunData.executionStatus
                        : appConstants.INCOMPLETE_STATUS,
                  });
                  testRunData = null;
                }
              }
              if (!matchFound) {
                tableData.push({
                  testCaseType: testCase.testCaseType,
                  testName: testCase.testName,
                  testId: testCase.testId,
                  testDescription: testCase.testDescription,
                  methodName: testCase.methodName,
                  methodId: '',
                  methodRequest: appConstants.NO_DATA_AVAILABLE,
                  methodResponse: appConstants.NO_DATA_AVAILABLE,
                  resultStatus: appConstants.FAILURE,
                  resultDescription: appConstants.NO_DATA_AVAILABLE,
                  testDataSource: '',
                  methodUrl: '',
                  executionStatus:
                    appConstants.INCOMPLETE_STATUS,
                });
              }
            }
            this.dataSource = new MatTableDataSource(tableData);
            this.dataSource.paginator = this.paginator;
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

  async getMethodDetails(row: any) {

    let fetchData = false;
    if (row.methodRequest == appConstants.LOADING ||
      row.methodResponse == appConstants.LOADING ||
      row.resultDescription == appConstants.LOADING) {
      fetchData = true;
    }
    if (fetchData && row.methodId != '') {
      fetchData = true;
    } else {
      fetchData = false;
    }
    if (fetchData) {
      return new Promise((resolve, reject) => {
        this.subscriptions.push(
          this.dataService.getMethodDetails(this.isAdmin, this.partnerId, this.runId, row.testId, row.methodId).subscribe(
            (response: any) => {
              const methodDetails = response[appConstants.RESPONSE];
              row.methodRequest = methodDetails["methodRequest"];
              row.methodResponse = methodDetails["methodResponse"];
              row.resultDescription = methodDetails["resultDescription"];
              resolve(true);
            },
            (errors) => {
              resolve(true);
            }
          )
        );
      });
    } else {
      return true;
    }
  }

  getValidationsList(row: any): any[] {
    if (row.resultDescription != appConstants.NO_DATA_AVAILABLE && row.resultDescription != '') {
      let jsonData = JSON.parse(row.resultDescription);
      let list = jsonData['validationsList'];
      return list;
    } else {
      let data = [];
      for (const testcase of this.testcasesList) {
        if (testcase.testId == row.testId) {
          for (const validator of testcase.validatorDefs) {
            const item = validator[0];
            data.push({
              validatorName: item.name,
              validatorDescription: item.description,
              status: appConstants.FAILURE,
              description: appConstants.NO_DATA_AVAILABLE,
            });
          }
        }
      }
      return data;
    }
  }
  getValidatorDetails(item: any) {
    return this.resourceBundleJson.validators[item.validatorName]
      ? `${item.validatorName} (${this.resourceBundleJson.validators[item.validatorName]})`
      : `${item.validatorName} (${item.validatorDescription})`;
  }

  getValidatorMessage(item: any) {
    const validatorMessages = this.resourceBundleJson["validatorMessages"];
    let descriptionKeyString = item.descriptionKey;
    let translatedMsg = '';
    if (item && item.description && descriptionKeyString && this.resourceBundleJson &&
      validatorMessages) {
      translatedMsg = Utils.getTranslatedMessage(validatorMessages, descriptionKeyString);
      return translatedMsg;
    }
    if (item) {
      return item.description;
    } else {
      return "";
    }
  }

  getProjectName() {
    let name = "";
    if (this.sbiProjectData)
      name = this.sbiProjectData.name;
    if (this.sdkProjectData)
      name = this.sdkProjectData.name;
    if (this.abisProjectData)
      name = this.abisProjectData.name;
    return name;
  }

  downloadGeneratedReport() {
    this.dataLoaded = false;
    let reportRequest = {
      projectType: this.projectType,
      projectId: this.projectId,
      collectionId: this.collectionId,
      testRunId: this.runId
    };
    let request = {
      id: appConstants.PARTNER_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: reportRequest
    };
    const subs = this.dataService.generateDraftReport(request).subscribe(
      (res: any) => {
        this.dataLoaded = true;
        if (res) {
          const fileByteArray = res;
          var blob = new Blob([fileByteArray], { type: 'application/pdf' });
          console.log('isAndroidAppMode' + this.isAndroidAppMode);
          if (this.isAndroidAppMode) {
            let fileName = this.getProjectName() + ".pdf";
            console.log('ready to download');
            Utils.convertBlobToBase64(blob).then(async (base64) => {
              await Filesystem.writeFile({
                path: fileName,
                data: base64 as string,
                directory: Directory.Documents
              });
              Toast.show({
                text: 'File has been downloaded to Documents folder: ' + fileName,
              }).catch((error) => {
                console.log(error);
              });
            });
          } else {
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = this.getProjectName();
            link.click();
          }
          const dialogRef = this.dialog.open(DialogComponent, {
            width: '600px',
            data: {
              case: "SEND_FOR_REVIEW",
              reviewRequest: reportRequest
            },
          });
          dialogRef.afterClosed();

        } else {
          Utils.showErrorMessage(this.resourceBundleJson,
            null,
            this.dialog,
            'Unable to download PDF file. Try Again!');
        }
      },
      (errors) => {
        Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
      }
    );
    this.subscriptions.push(subs);

  }

  async downloadSubmittedReport() {
    this.dataLoaded = false;
    let reportrequest = {
      projectType: this.projectType,
      projectId: this.projectId,
      collectionId: this.collectionId,
      testRunId: null,
      projectName: this.getProjectName()
    };
    await Utils.getReport(this.isAndroidAppMode, false, reportrequest, this.dataService, this.resourceBundleJson, this.dialog);
    this.dataLoaded = true;
  }

  async backToProject() {
    if (this.isAdmin) {
      if (this.authService.isAuthenticated()) {
        await this.router.navigate([`toolkit/dashboard`]);
      } else {
        await this.router.navigate([``]);
      }
    } else {
      await this.router.navigate([
        `toolkit/project/${this.projectType}/${this.projectId}`,
      ]);
    }

  }

}
