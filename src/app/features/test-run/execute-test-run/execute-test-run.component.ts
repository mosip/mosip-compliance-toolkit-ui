import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { Subscription } from 'rxjs';
import { CdTimerComponent } from 'angular-cd-timer';
import { SbiTestCaseService } from '../../../core/services/sbi-testcase-service';
import { SdkTestCaseService } from '../../../core/services/sdk-testcase-service';
import { SbiTestCaseAndroidService } from '../../../core/services/sbi-testcase-android-service';
import { TestCaseModel } from 'src/app/core/models/testcase';
import { Router } from '@angular/router';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { environment } from 'src/environments/environment';
import { AbisTestCaseService } from 'src/app/core/services/abis-testcase-service';
import { AbisProjectModel } from 'src/app/core/models/abis-project';
import { RxStompService } from 'src/app/core/services/rx-stomp.service';
import { ActiveMqService } from 'src/app/core/services/activemq-service';
import { Message } from '@stomp/stompjs';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import Utils from 'src/app/app.utils';
import { error } from 'console';

declare const start_streaming: any;
declare const stop_streaming: any;

@Component({
  selector: 'app-execute-test-run',
  templateUrl: './execute-test-run.component.html',
  styleUrls: ['./execute-test-run.component.css'],
})
export class ExecuteTestRunComponent implements OnInit {
  input: any;
  collectionId: string;
  projectType: string;
  projectId: string;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  collectionName: string;
  subscriptions: Subscription[] = [];
  scanComplete = true;
  runComplete = false;
  validationErrMsg: string;
  currectTestCaseId: string;
  currectTestCaseName: string;
  currentTestDescription: string;
  currectDeviceSubId: string;
  currentTestCaseIsRCapture = false;
  errorsInGettingTestcases = false;
  serviceErrors = false;
  errorsInSavingTestRun = false;
  showLoader = false;
  initiateCapture = false;
  showInitiateCaptureBtn = false;
  showStreamingBtn = false;
  streamingDone = false;
  pauseExecution = false;
  showResumeBtn = false;
  showResumeAgainBtn = false;
  showContinueBtn = false;
  beforeKeyRotationResp: any = null;
  errorsSummary: string[];
  testCasesList: any;
  testRunId: string;
  dataLoaded = false;
  startTestRunDt: string;
  endTestRunDt: string;
  progressDone = 0;
  sbiDeviceType: string;
  @ViewChild('basicTimer', { static: true }) basicTimer: CdTimerComponent;
  countOfSuccessTestcases = 0;
  countOfFailedTestcases = 0;
  sbiSelectedPort = localStorage.getItem(appConstants.SBI_SELECTED_PORT)
    ? localStorage.getItem(appConstants.SBI_SELECTED_PORT)
    : null;
  sbiSelectedDevice = localStorage.getItem(appConstants.SBI_SELECTED_DEVICE)
    ? localStorage.getItem(appConstants.SBI_SELECTED_DEVICE)
    : null;
  keyRotationIterations = this.appConfigService.getConfig()[
    appConstants.SBI_KEY_ROTATION_ITERATIONS
  ]
    ? parseInt(
      this.appConfigService.getConfig()[
      appConstants.SBI_KEY_ROTATION_ITERATIONS
      ]
    )
    : 0;
  currentKeyRotationIndex = 0;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  abisRequestSendFailure = false;
  abisSentMessage: string = appConstants.BLANK_STRING;
  abisSentDataSource: string = appConstants.BLANK_STRING;
  abisRecvdMessage: string = appConstants.BLANK_STRING;
  cbeffFileSuffix: number = 0;
  currentCbeffFile: number = 0;
  isCombinationAbisTestcase = false;
  currentAbisMethod: string = appConstants.BLANK_STRING;
  textDirection: any = this.userProfileService.getTextDirection();
  resourceBundleJson: any = {};

  constructor(
    private dialogRef: MatDialogRef<ExecuteTestRunComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private router: Router,
    private dialog: MatDialog,
    private sbiTestCaseService: SbiTestCaseService,
    private sdkTestCaseService: SdkTestCaseService,
    private sbiTestCaseAndroidService: SbiTestCaseAndroidService,
    private abisTestCaseService: AbisTestCaseService,
    private appConfigService: AppConfigService,
    private rxStompService: RxStompService,
    private activeMqService: ActiveMqService
  ) {
    dialogRef.disableClose = true;
  }

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.input = this.data;
    this.collectionId = this.input.collectionId;
    this.projectType = this.input.projectType;
    this.projectId = this.input.projectId;
    this.sbiDeviceType = this.input.sbiDeviceType;
    this.basicTimer.start();
    localStorage.removeItem(appConstants.SDK_PROJECT_URL);
    if (await this.performValidations()) {
      await this.getCollection();
      await this.getTestcasesForCollection();
      this.dataLoaded = true;
      if (!this.errorsInGettingTestcases) {
        await this.createTestRun();
      }
    }
    this.basicTimer.stop();
  }

  async performValidations(): Promise<boolean> {
    if (this.projectType === appConstants.SBI) {
      this.validationErrMsg = '';
      if (!(this.sbiSelectedPort && this.sbiSelectedDevice)) {
        this.scanComplete = false;
        this.dataLoaded = true;
        return false;
      }
      if (this.sbiSelectedPort && this.sbiSelectedDevice) {
        await this.getSbiProjectDetails();
        const selectedSbiDevice: SbiDiscoverResponseModel = JSON.parse(
          this.sbiSelectedDevice
        );
        if (
          selectedSbiDevice.purpose != '' &&
          this.sbiProjectData.purpose != selectedSbiDevice.purpose
        ) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg = this.resourceBundleJson['executeTestRun']['validationErrMsgForPurpose'];
          return false;
        }
        if (
          this.sbiProjectData.deviceType !=
          selectedSbiDevice.digitalIdDecoded.type
        ) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg = this.resourceBundleJson['executeTestRun']['validationErrMsgForDeviceType'];
          return false;
        }
        if (
          this.sbiProjectData.deviceSubType !=
          selectedSbiDevice.digitalIdDecoded.deviceSubType
        ) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg = this.resourceBundleJson['executeTestRun']['validationErrMsgForDeviceSubType'];
          return false;
        }
      }
    }
    return true;
  }

  async getSbiProjectDetails() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(this.projectId).subscribe(
          (response: any) => {
            this.sbiProjectData = response['response'];
            resolve(true);
          },
          (errors) => {
            this.errorsInGettingTestcases = true;
            resolve(true);
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
            this.sdkProjectData = response['response'];
            resolve(true);
          },
          (errors) => {
            this.errorsInGettingTestcases = true;
            resolve(true);
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
            this.errorsInGettingTestcases = true;
            resolve(true);
          }
        )
      );
    });
  }

  async getCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getCollection(this.collectionId).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errorsInGettingTestcases = true;
              resolve(true);
            }
            this.collectionName =
              response[appConstants.RESPONSE][appConstants.NAME];
            resolve(true);
          },
          (errors) => {
            this.errorsInGettingTestcases = true;
            resolve(true);
          }
        )
      );
    });
  }

  async getTestcasesForCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestcasesForCollection(this.collectionId).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errorsInGettingTestcases = true;
              resolve(true);
            }
            this.testCasesList =
              response[appConstants.RESPONSE][appConstants.TESTCASES];
            resolve(true);
          },
          (errors) => {
            this.errorsInGettingTestcases = true;
            resolve(true);
          }
        )
      );
    });
  }

  async createTestRun() {
    const testCasesListSorted: TestCaseModel[] = this.testCasesList;
    //sort the testcases based on the testId
    if (testCasesListSorted && testCasesListSorted.length > 0) {
      testCasesListSorted.sort(function (a: TestCaseModel, b: TestCaseModel) {
        if (a.testId > b.testId) return 1;
        if (a.testId < b.testId) return -1;
        return 0;
      });
    }
    //first create a testrun in db
    await this.addTestRun();
    this.testCasesList = testCasesListSorted;
    if (!this.errorsInSavingTestRun) {
      await this.runExecuteForLoop(true, false);
    }
    this.runComplete = true;
    this.basicTimer.stop();
  }

  async runExecuteForLoop(startingForLoop: boolean, fromResumeNext: boolean) {
    for (const testCase of this.testCasesList) {
      this.showLoader = false;
      let proceedTestCase = false;
      if (startingForLoop && testCase.otherAttributes.resumeBtn) {
        this.showResumeBtn = true;
      }
      if (
        !startingForLoop &&
        this.currectTestCaseId != '' &&
        this.currectTestCaseId == testCase.testId
      ) {
        proceedTestCase = true;
      }
      if (
        fromResumeNext &&
        this.currectTestCaseId != '' &&
        testCase.testId == this.currectTestCaseId &&
        testCase.otherAttributes.resumeBtn
      ) {
        this.showResumeBtn = true;
      }
      if (proceedTestCase || startingForLoop) {
        startingForLoop = true;
        this.currectTestCaseId = testCase.testId;
        const testCaseInResourceBundle = this.resourceBundleJson.testcases[testCase.testId];
        this.currectTestCaseName = testCaseInResourceBundle
          ? testCaseInResourceBundle.testName
          : testCase.testName;
        this.currentTestDescription = testCaseInResourceBundle
          ? this.getTestDescription(testCaseInResourceBundle)
          : this.getTestDescription(testCase);
        this.currentTestCaseIsRCapture =
          testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE
            ? true
            : false;
        this.currectDeviceSubId = testCase.otherAttributes.deviceSubId;
        if (!this.initiateCapture) {
          this.checkIfToShowInitiateCaptureBtn(testCase);
        }
        if (!this.streamingDone) {
          this.checkIfToShowStreamBtn(testCase);
        }
        console.log(`this.currectTestCaseId: ${this.currectTestCaseId}`);
        const res: any = await this.executeCurrentTestCase(testCase);
        if (res) {
          startingForLoop = this.handleErr(res);
          //handle key rotation flow
          if (this.currentKeyRotationIndex < this.keyRotationIterations) {
            this.handleKeyRotationFlow(startingForLoop, testCase, res);
            if (this.showContinueBtn) {
              const promise = new Promise((resolve, reject) => { });
              if (await promise) {
                console.log("done waiting");
              }
            }
          }
          this.calculateTestcaseResults(res[appConstants.VALIDATIONS_RESPONSE]);
          //update the test run details in db
          await this.addTestRunDetails(testCase, res);
          //update the testrun in db with execution time
          await this.updateTestRun();
          if (testCase.otherAttributes.resumeAgainBtn) {
            this.showResumeAgainBtn = true;
            const promise = new Promise((resolve, reject) => { });
            if (await promise) {
              console.log("done waiting");
            }
          }
          let resetCurrentTestCase = true;
          //reset all attributes for next testcase
          if (this.projectType == appConstants.ABIS) {
            // //disconnect from queue if already connected
            if (this.rxStompService && this.rxStompService.connected()) {
              this.rxStompService.deactivate()
                .catch((error) => {
                  console.log(error);
                });
            }
            this.abisSentMessage = appConstants.BLANK_STRING;
            this.abisRecvdMessage = appConstants.BLANK_STRING;
            //when there are multiple cbeff files to be inserted then after last file is inserted
            //this.cbeffFileSuffix will be reset to 0, otherwise it will be > 0
            if (this.cbeffFileSuffix > 0 && !this.abisRequestSendFailure) {
              //do no reset current testcaseId
              resetCurrentTestCase = false;
              this.abisRequestSendFailure = false;
              await this.startWithSameTestcase();
            }
            else if (this.isCombinationAbisTestcase && !this.abisRequestSendFailure) {
              this.currentAbisMethod = appConstants.ABIS_METHOD_IDENTIFY;
              //do no reset current testcaseId
              resetCurrentTestCase = false;
              this.abisRequestSendFailure = false;
              await this.startWithSameTestcase();
            }
          }
          if (resetCurrentTestCase) {
            this.currectTestCaseId = '';
            this.currectTestCaseName = '';
            this.currentTestDescription = '';
            this.currentCbeffFile = 0;
            this.showLoader = false;
            this.abisSentDataSource = appConstants.BLANK_STRING;
            this.abisRequestSendFailure = false;
          }

        }
      }
    }
  }
  getTestDescription(testcase: TestCaseModel) {
    if (!this.isAndroidAppMode) {
      return testcase.testDescription;
    } else {
      return testcase.androidTestDescription
        ? testcase.androidTestDescription
        : testcase.testDescription;
    }
  }
  handleKeyRotationFlow(
    startingForLoop: boolean,
    testCase: TestCaseModel,
    res: any
  ) {
    if (
      startingForLoop &&
      this.projectType === appConstants.SBI &&
      testCase.otherAttributes.keyRotationTestCase
    ) {
      let testcaseFailed = false;
      console.log("res");
      console.log(res);
      if (
        res &&
        res[appConstants.VALIDATIONS_RESPONSE] &&
        res[appConstants.VALIDATIONS_RESPONSE][appConstants.RESPONSE]
      ) {
        const validationsList =
          res[appConstants.VALIDATIONS_RESPONSE][appConstants.RESPONSE][
          appConstants.VALIDATIONS_LIST
          ];
        if (validationsList && validationsList.length > 0) {
          validationsList.forEach((validationitem: any) => {
            if (validationitem.status == appConstants.FAILURE) {
              testcaseFailed = true;
            }
          });
        }
      }
      if (!testcaseFailed) {
        this.beforeKeyRotationResp = JSON.parse(res.methodResponse);
        this.showContinueBtn = true;
        this.showLoader = false;
        this.currentKeyRotationIndex++;
      }
    }
  }

  handleErr(res: any) {
    const errors = res[appConstants.ERRORS];
    if (errors && errors.length > 0) {
      this.serviceErrors = true;
      this.errorsSummary = [];
      errors.forEach((err: any) => {

        this.errorsSummary.push(
          err[appConstants.ERROR_CODE] + ' - ' + err[appConstants.MESSAGE]
        );
      });
      return false;
    }
    return true;
  }

  checkIfToShowInitiateCaptureBtn(testCase: TestCaseModel) {
    if (this.projectType === appConstants.SBI) {
      if (testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE) {
        this.showInitiateCaptureBtn = true;
      }
    }
  }

  checkIfToShowStreamBtn(testCase: TestCaseModel) {
    if (this.projectType === appConstants.SBI) {
      if (
        testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE &&
        !this.isAndroidAppMode
      ) {
        this.showStreamingBtn = true;
      }
      if (
        testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE &&
        this.isAndroidAppMode
      ) {
        this.streamingDone = true;
        this.showInitiateCaptureBtn = true;
      }
    }
  }

  async addTestRun() {
    this.startTestRunDt = new Date().toISOString();
    const testRunRequest = {
      collectionId: this.collectionId,
      runDtimes: this.startTestRunDt,
    };
    let request = {
      id: appConstants.TEST_RUN_ADD_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: testRunRequest,
    };
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addTestRun(request).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errorsInSavingTestRun = true;
              resolve(true);
            }
            this.testRunId = response[appConstants.RESPONSE][appConstants.ID];
            resolve(true);
          },
          (errors) => {
            this.errorsInSavingTestRun = true;
            resolve(true);
          }
        )
      );
    });
  }

  async updateTestRun() {
    this.endTestRunDt = new Date().toISOString();
    const testRunRequest = {
      id: this.testRunId,
      collectionId: this.collectionId,
      runDtimes: this.startTestRunDt,
      executionDtimes: this.endTestRunDt,
    };
    let request = {
      id: appConstants.TEST_RUN_UPDATE_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: testRunRequest,
    };
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.updateTestRun(request).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errorsInSavingTestRun = true;
              resolve(true);
            }
            resolve(true);
          },
          (errors) => {
            this.errorsInSavingTestRun = true;
            resolve(true);
          }
        )
      );
    });
  }

  async addTestRunDetails(testCase: TestCaseModel, res: any) {
    let resultStatus = appConstants.FAILURE;
    let countofPassedValidators = 0;
    let validations: any = [];
    if (
      res &&
      res[appConstants.VALIDATIONS_RESPONSE] &&
      res[appConstants.VALIDATIONS_RESPONSE][appConstants.RESPONSE]
    ) {
      const validationsList =
        res[appConstants.VALIDATIONS_RESPONSE][appConstants.RESPONSE][
        appConstants.VALIDATIONS_LIST
        ];
      if (validationsList && validationsList.length > 0) {
        validationsList.forEach((validationitem: any) => {
          if (validationitem.status == appConstants.SUCCESS) {
            countofPassedValidators++;
          }
        });
        if (validationsList.length == countofPassedValidators) {
          resultStatus = appConstants.SUCCESS;
        } else {
          resultStatus = appConstants.FAILURE;
        }
        validations = validationsList;
      }
    }
    const testRunRequest = {
      runId: this.testRunId,
      testcaseId: testCase.testId,
      methodUrl: res.methodUrl ? res.methodUrl : '',
      methodRequest: res.methodRequest,
      methodResponse: res.methodResponse,
      resultStatus: resultStatus,
      resultDescription: JSON.stringify({
        validationsList: validations,
      }),
      testDataSource: res.testDataSource ? res.testDataSource : '',
    };
    let request = {
      id: appConstants.TEST_RUN_DETAILS_ADD_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: testRunRequest,
    };
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.addTestRunDetails(request).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errorsInSavingTestRun = true;
              resolve(true);
            }
            if (this.projectType == appConstants.ABIS) {
              if (this.cbeffFileSuffix == 0 && !this.isCombinationAbisTestcase) {
                this.progressDone =
                  this.progressDone + 100 / this.testCasesList.length;
              }
            } else {
              this.progressDone =
                this.progressDone + 100 / this.testCasesList.length;
            }
            resolve(true);
          },
          (errors) => {
            this.errorsInSavingTestRun = true;
            if (this.projectType == appConstants.ABIS) {
              if (this.cbeffFileSuffix == 0) {
                this.progressDone =
                  this.progressDone + 100 / this.testCasesList.length;
              }
            } else {
              this.progressDone =
                this.progressDone + 100 / this.testCasesList.length;
            }
            resolve(true);
          }
        )
      );
    });
  }
  async executeCurrentTestCase(testCase: TestCaseModel) {
    if (this.projectType === appConstants.SBI) {
      const res: any = await this.executeSBITestCase(testCase);
      return res;
    } else if (this.projectType == appConstants.SDK) {
      const res: any = await this.executeSDKTestCase(testCase);
      return res;
    } else if (this.projectType == appConstants.ABIS) {
      const res: any = await this.executeABISTestCase(testCase);
      return res;
    } else {
      return true;
    }
  }

  async executeSDKTestCase(testCase: TestCaseModel) {
    if (!this.sdkProjectData)
      await this.getSdkProjectDetails();
    localStorage.setItem(
      appConstants.SDK_PROJECT_URL,
      this.sdkProjectData ? this.sdkProjectData.url : ''
    );
    this.showLoader = true;
    const res = await this.sdkTestCaseService.runTestCase(
      testCase,
      this.sdkProjectData.url,
      this.sdkProjectData.bioTestDataFileName
    );
    return res;
  }

  async executeABISTestCase(testCase: TestCaseModel) {
    this.isCombinationAbisTestcase = testCase.methodName.length > 1 ? true : false;
    if (this.isCombinationAbisTestcase && this.currentAbisMethod == appConstants.BLANK_STRING) {
      this.currentAbisMethod = appConstants.ABIS_METHOD_INSERT;
    }
    if (!this.isCombinationAbisTestcase) {
      this.currentAbisMethod = testCase.methodName[0];
    }
    if (this.abisRecvdMessage == appConstants.BLANK_STRING) {
      this.showLoader = true;
      if (!this.abisProjectData)
        await this.getAbisProjectDetails();
      //disconnect from queue if already connected
      if (this.rxStompService.connected()) {
        this.rxStompService.deactivate()
          .catch((error) => {
            console.log(error);
          });
      }
      //setup connection as per project configuration
      this.rxStompService = this.activeMqService.setUpConfig(this.abisProjectData);
      let requestId = "";
      let referenceId = "";
      let insertCount = 0;

      if (this.currentAbisMethod == appConstants.ABIS_METHOD_INSERT) {
        //ABIS testcase can have multiple CBEFF files, for each CBEFF file, same processing is reqd
        //this will help in cases where multiple sets of biometrics are to be inserted in ABIS in same testcase
        if (testCase.otherAttributes.bulkInsert && testCase.otherAttributes.insertCount) {
          insertCount = Number.parseInt(testCase.otherAttributes.insertCount);
        }
        //ABIS requestId is unique per request so set to testRunId_testcaseId
        requestId = this.testRunId + appConstants.UNDERSCORE + testCase.testId;
        if (insertCount > 1) {
          //cbeffFileSuffix keeps track of the current CBEFF file index for a testcase
          if (this.cbeffFileSuffix == 0) {
            this.cbeffFileSuffix = 1;
          }
          requestId = requestId + appConstants.UNDERSCORE + this.cbeffFileSuffix;
        }
        //ABIS referenceId is unique per set of biometrics so set to testRunId_testcaseId
        referenceId = requestId;
      }

      let galleryIds: { referenceId: string; }[] = [];
      //if testcase defines identifyReferenceId, then it is used 
      if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        requestId = this.testRunId + appConstants.UNDERSCORE + testCase.testId + appConstants.UNDERSCORE + appConstants.ABIS_METHOD_IDENTIFY;
        if (testCase.otherAttributes.identifyReferenceId) {
          referenceId = this.testRunId + appConstants.UNDERSCORE + testCase.otherAttributes.identifyReferenceId;
        }
        if (testCase.otherAttributes.identifyGalleryIds) {
          testCase.otherAttributes.identifyGalleryIds.forEach((galleryId: string) => {
            galleryIds.push({
              "referenceId": this.testRunId + appConstants.UNDERSCORE + galleryId
            });
          });
        }
      }
      //if testcase defines insertReferenceId, overwrite the above referenceId
      if (this.currentAbisMethod == appConstants.ABIS_METHOD_INSERT) {
        if (testCase.otherAttributes.insertReferenceId) {
          referenceId = this.testRunId + appConstants.UNDERSCORE + testCase.otherAttributes.insertReferenceId;
        }
      }
      console.log(`requestId: ${requestId}`);
      console.log(`referenceId: ${referenceId}`);
      this.currentCbeffFile = this.cbeffFileSuffix;
      this.abisRequestSendFailure = false;
      let methodIndex = 0;
      if (this.isCombinationAbisTestcase && this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        methodIndex = 1;
      }

      const abisReq: any = await this.abisTestCaseService.sendRequestToQueue(
        this.rxStompService,
        testCase,
        this.abisProjectData,
        this.currentAbisMethod,
        methodIndex,
        requestId,
        referenceId,
        galleryIds,
        this.cbeffFileSuffix,
        this.testRunId
      );
      if (abisReq)
        console.log(`send to queue status ${abisReq[appConstants.STATUS]}`);
      //console.log(abisReq);
      if (abisReq && abisReq[appConstants.STATUS] && abisReq[appConstants.STATUS] == appConstants.SUCCESS) {
        if (insertCount > 1) {
          this.cbeffFileSuffix = this.cbeffFileSuffix + 1;
        }
        if (this.cbeffFileSuffix > insertCount) {
          //reset the cbeffFileSuffix to zero, since all are processed
          this.cbeffFileSuffix = 0;
        }
        this.abisSentMessage = abisReq.methodRequest;
        if (this.isCombinationAbisTestcase && this.currentAbisMethod !== appConstants.ABIS_METHOD_IDENTIFY) {
          this.abisSentDataSource = abisReq.testDataSource;
        }
        console.log(`this.abisSentDataSource ${this.abisSentDataSource}`);
        this.subscribeToABISQueue(requestId);
        //wait till some message arrives in active mq
        const promise = new Promise((resolve, reject) => { });
        if (await promise) {
          return true;
        } else {
          return false;
        }
      } else {
        console.log("INSERT REQUEST FAILED");
        this.cbeffFileSuffix = 0;
        this.abisRequestSendFailure = true;
        this.abisSentMessage = appConstants.BLANK_STRING;
        this.abisSentDataSource = appConstants.BLANK_STRING;
        //resolve(true);
        return true;
      }
    } else {
      this.showLoader = true;
      //run validations
      let methodIndex = 0;
      if (this.isCombinationAbisTestcase && this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        methodIndex = 1;
      }
      const validatorsResp = await this.abisTestCaseService.runValidators(testCase, this.abisProjectData, this.currentAbisMethod,
        this.abisSentMessage, this.abisRecvdMessage, this.abisSentDataSource, methodIndex);
      if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        this.isCombinationAbisTestcase = false;
        this.currentAbisMethod = appConstants.BLANK_STRING;
      }
      return validatorsResp;
    }
  }

  async executeSBITestCase(testCase: TestCaseModel) {
    if (
      testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE ||
      testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE
    ) {
      if (this.initiateCapture) {
        this.initiateCapture = false;
        this.showLoader = true;
        let res: any;
        if (!this.isAndroidAppMode) {
          res = await this.sbiTestCaseService.runTestCase(
            testCase,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            null
          );
        } else {
          res = await this.sbiTestCaseAndroidService.runTestCase(
            testCase,
            this.sbiDeviceType,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            null
          );
        }
        this.streamingDone = false;
        if (!this.isAndroidAppMode) {
          this.stopStreaming();
        }
        //resolve(res);
        return res;
      }
      else {
        //no resp to keep the for loop on hold
        //wait till user clicks on the required button in UI
        const promise = new Promise((resolve, reject) => { });
        if (await promise) {
          return false;
        }
      }
    } else {
      if (this.showResumeBtn) {
        this.pauseExecution = true;
      }
      if (!this.pauseExecution) {
        this.showLoader = true;
        let beforeKeyRotationDeviceResp = null;
        if (
          testCase.otherAttributes.keyRotationTestCase &&
          this.beforeKeyRotationResp
        ) {
          beforeKeyRotationDeviceResp = this.beforeKeyRotationResp;
        }
        let res: any;
        if (!this.isAndroidAppMode) {
          res = await this.sbiTestCaseService.runTestCase(
            testCase,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            beforeKeyRotationDeviceResp
          );
        } else {
          res = await this.sbiTestCaseAndroidService.runTestCase(
            testCase,
            this.sbiDeviceType,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            beforeKeyRotationDeviceResp
          );
        }
        this.beforeKeyRotationResp = null;
        return res;
      }
      else {
        //no resp to keep the for loop on hold
        //wait till user clicks on the required button in UI
        const promise = new Promise((resolve, reject) => { });
        if (await promise) {
          return true;
        }
      }
    }
  }

  calculateTestcaseResults(res: any) {
    let allValidatorsPassed = false;
    if (res && res[appConstants.RESPONSE]) {
      let countofPassedValidators = 0;
      const response = res[appConstants.RESPONSE];
      const validationsList = response[appConstants.VALIDATIONS_LIST];
      if (validationsList) {
        validationsList.forEach((validationitem: any) => {
          if (validationitem.status == appConstants.SUCCESS) {
            countofPassedValidators++;
          }
        });
        if (validationsList.length == countofPassedValidators) {
          allValidatorsPassed = true;
        }
      }
    }
    let updateCount = false;
    if (this.projectType == appConstants.ABIS) {
      if (!this.isCombinationAbisTestcase) {
        if (this.cbeffFileSuffix == 0) {
          updateCount = true;
        }
      } else if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        updateCount = true;
      }
    } else {
      updateCount = true;
    }
    if (updateCount) {
      if (allValidatorsPassed) {
        this.countOfSuccessTestcases++;
      } else {
        this.countOfFailedTestcases++;
      }
    }
  }

  getAbisSentMessage() {
    if (this.currentAbisMethod == appConstants.ABIS_METHOD_INSERT) {
      let translatedMsg = this.resourceBundleJson["executeTestRun"]["abisInsertRequestSent"];
      if (this.currentCbeffFile == 0) {
        translatedMsg = translatedMsg.replace(/\{\}/g, "");
      } else {
        translatedMsg = translatedMsg.replace(/\{\}/g, (this.currentCbeffFile));
      }
      return translatedMsg;
    }
    if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
      let translatedMsg = this.resourceBundleJson["executeTestRun"]["abisIdentifyRequestSent"];
      return translatedMsg;
    }
  }

  async setInitiateCapture() {
    this.initiateCapture = true;
    this.showInitiateCaptureBtn = false;
    await this.runExecuteForLoop(false, false);
    this.runComplete = true;
    this.basicTimer.stop();
  }

  async setResume() {
    this.showResumeBtn = false;
    this.pauseExecution = false;
    await this.runExecuteForLoop(false, false);
    this.runComplete = true;
    this.basicTimer.stop();
  }

  getIndexInList() {
    let testCases = this.testCasesList;
    for (const testCase of this.testCasesList) {
      if (
        this.currectTestCaseId != '' &&
        this.currectTestCaseId == testCase.testId
      ) {
        let ind = testCases.indexOf(testCase);
        return ind;
      }
    }
    return -1;
  }

  async setResumeAgain() {
    this.showResumeAgainBtn = false;
    this.pauseExecution = false;
    await this.startWithNextTestcase();
  }

  async startWithNextTestcase() {
    let testCases = this.testCasesList;
    const currentId = this.currectTestCaseId;
    if (
      this.testCasesList.length > 1 &&
      this.getIndexInList() + 1 < this.testCasesList.length
    ) {
      for (const testCase of this.testCasesList) {
        if (currentId != '' && currentId == testCase.testId) {
          let ind = testCases.indexOf(testCase);
          ind = ind + 1;
          if (testCases[ind]) this.currectTestCaseId = testCases[ind].testId;
        }
      }
      await this.runExecuteForLoop(false, true);
    }
    this.runComplete = true;
    this.basicTimer.stop();
  }

  async startWithSameTestcase() {
    await this.runExecuteForLoop(false, true);
    this.runComplete = true;
    this.basicTimer.stop();
  }

  getStreamImgTagId() {
    let id = this.currectTestCaseId;
    return id;
  }

  startStreaming() {
    this.showStreamingBtn = false;
    this.stopStreaming();
    const selectedSbiDevice: SbiDiscoverResponseModel = JSON.parse(
      this.sbiSelectedDevice ? this.sbiSelectedDevice : ''
    );
    const deviceId = selectedSbiDevice.deviceId;
    const deviceSubId = this.currectDeviceSubId;
    let methodUrl = '';
    const SBI_BASE_URL = this.appConfigService.getConfig()['SBI_BASE_URL'];
    methodUrl =
      SBI_BASE_URL +
      ':' +
      this.sbiSelectedPort +
      '/' +
      appConstants.SBI_METHOD_STREAM;
    start_streaming(methodUrl, deviceId, deviceSubId, this.getStreamImgTagId());
    this.streamingDone = true;
    this.showInitiateCaptureBtn = true;
  }

  stopStreaming() {
    stop_streaming();
  }

  async setContinue() {
    this.showContinueBtn = false;
    await this.runExecuteForLoop(false, false);
    this.runComplete = true;
    this.basicTimer.stop();
  }

  /*
  scanDevice() {
    const body = {
      title: 'Scan Device',
    };
    this.dialog
      .open(ScanDeviceComponent, {
        width: '600px',
        data: body,
      })
      .afterClosed()
      .subscribe(() => {
        this.sbiSelectedPort = localStorage.getItem(
          appConstants.SBI_SELECTED_PORT
        )
          ? localStorage.getItem(appConstants.SBI_SELECTED_PORT)
          : null;
        this.sbiSelectedDevice = localStorage.getItem(
          appConstants.SBI_SELECTED_DEVICE
        )
          ? localStorage.getItem(appConstants.SBI_SELECTED_DEVICE)
          : null;
      });
  }*/

  close() {
    this.dialogRef.close('reloadProjectDetails');
  }

  async viewTestRun() {
    this.dialogRef.close('');
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${this.testRunId}`,
    ]);
  }

  subscribeToABISQueue(sentRequestId: string) {
    if (!this.rxStompService.connected()) {
      this.rxStompService = this.activeMqService.setUpConfig(this.abisProjectData);
    }
    this.rxStompService
      .watch(this.abisProjectData.inboundQueueName)
      .subscribe((message: Message) => {
        this.handleMessage(message, sentRequestId);
      });
  }

  async handleMessage(message: Message, sentRequestId: string) {
    const respObj = JSON.parse(message.body);
    const recvdRequestId = respObj[appConstants.REQUEST_ID];
    console.log(`recvdRequestId: ${recvdRequestId}`);
    if (sentRequestId == recvdRequestId) {
      this.abisRecvdMessage = message.body;
      //console.log(this.abisRecvdMessage);
      await this.runExecuteForLoop(false, false);
      this.runComplete = true;
      this.basicTimer.stop();
    }
  }
  ngOnDestroy() {
    if (this.rxStompService) {
      this.rxStompService.deactivate()
        .catch((error) => {
          console.log(error);
        });
    }
  }

  getExecuteSuccessMsg(): any {
    const executeTestRunInResourceBundle = this.resourceBundleJson.executeTestRun;
    return this.testCasesList.length > 1
      ? `${executeTestRunInResourceBundle['total']} ${this.testCasesList.length} ${executeTestRunInResourceBundle['testcases']} `
      : `${executeTestRunInResourceBundle['total']} ${this.testCasesList.length} ${executeTestRunInResourceBundle['testcase']} `
  }
}
