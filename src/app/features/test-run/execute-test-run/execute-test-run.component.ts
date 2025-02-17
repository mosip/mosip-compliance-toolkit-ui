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
import { sha256 } from 'js-sha256';

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
  currentMethodId = 'Not_Available';
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
  previousHash: string;
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
  currentMethodIndex = 0;
  hashValidatorIterations = 3;
  totalQATestCaseIterations = 0;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  firstMethodRespForSDK: any = null;
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
    this.previousHash = sha256("");
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
        const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        if (sbiProjectDetails) {
          this.sbiProjectData = sbiProjectDetails;
        }
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
        this.dataService.getTestcasesForCollection(false, '', this.collectionId).subscribe(
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
        if (testCase.otherAttributes.testCaseRepeatCount) {
          this.totalQATestCaseIterations = parseInt(testCase.otherAttributes.testCaseRepeatCount);
        }
        if (!this.initiateCapture) {
          this.checkIfToShowInitiateCaptureBtn(testCase);
        }
        if (!this.streamingDone) {
          this.checkIfToShowStreamBtn(testCase);
        }
        console.log(`currectTestCaseId: ${this.currectTestCaseId}`);
        const res: any = await this.executeCurrentTestCase(testCase);
        if (res) {
          startingForLoop = this.handleErr(res);
          
          let ignoreThisIteration = false;
          if (this.projectType == appConstants.SBI && testCase.otherAttributes.keyRotationTestCase
            && this.currentMethodIndex == 0) {
            ignoreThisIteration = true;
          }
          const testCaseComplete = this.checkIfTestCaseExecutionIsDone(testCase);
          let allValidatorsPassed = this.checkIfAllValidatorsPassed(res[appConstants.VALIDATIONS_RESPONSE]);
          if (!ignoreThisIteration) {
            if (testCaseComplete) {
              this.previousHash = sha256("");
              //update updateSuccessFailureCount
              this.updateSuccessFailureCount(allValidatorsPassed, testCase);
            }
            //always update the test run details in db
            await this.addTestRunDetails(testCaseComplete, allValidatorsPassed, res, testCase);
            //update the testrun in db with execution time
            await this.updateTestRun();
          } else {
            allValidatorsPassed = true;
          }
          //handle key rotation, hash validation, quality assessment  testcases
          await this.handleSBIRepeatMethodFlow(startingForLoop, testCase, allValidatorsPassed, res);
          await this.handleSBIResumeAgainFlow(startingForLoop, testCase);
          //for SDK, decide to reset the current testcase or not
          await this.handleSDKResetCurrentTestCaseFlow(startingForLoop);
          //reset the testcase
          let resetCurrentTestCase = true;
          //for ABIS, decide to reset the current testcase or not
          resetCurrentTestCase = await this.handleABISResetCurrentTestCaseFlow(startingForLoop);
          if (resetCurrentTestCase) {
            this.currectTestCaseId = '';
            this.currectTestCaseName = '';
            this.currentTestDescription = '';
            this.currentCbeffFile = 0;
            this.showLoader = false;
            this.abisSentDataSource = appConstants.BLANK_STRING;
            this.abisRequestSendFailure = false;
            this.currentMethodIndex = 0;
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

  async handleSBIRepeatMethodFlow(startingForLoop: boolean,
    testCase: TestCaseModel,
    allValidatorsPassed: boolean,
    res: any) {
    let showContinue = false;
    if (testCase.otherAttributes.keyRotationTestCase) {
      if (this.currentMethodIndex < (this.keyRotationIterations - 1)) {
        this.currentMethodIndex++;
        showContinue = true;
      }
    }
    if (testCase.otherAttributes.qualityAssessmentTestCase) {
      if (this.currentMethodIndex < (this.totalQATestCaseIterations - 1)) {
        this.currentMethodIndex++;
        showContinue = true;
      }
    }
    if (testCase.otherAttributes.hashValidationTestCase) {
      if (this.currentMethodIndex < (this.hashValidatorIterations - 1)) {
        this.currentMethodIndex++;
        showContinue = true;
      }
    }
    if (showContinue) {
      this.handleContinueBtnFlow(startingForLoop, testCase, allValidatorsPassed, res);
      if (this.showContinueBtn) {
        const promise = new Promise((resolve, reject) => { });
        if (await promise) {
          console.log("done waiting");
        }
      }
    }
  }

  async handleSDKResetCurrentTestCaseFlow(startingForLoop: boolean) {
    if (this.projectType == appConstants.SDK && startingForLoop) {
      if (this.currentMethodIndex > 0) {
        await this.startWithSameTestcase();
        const promise = new Promise((resolve, reject) => { });
        if (await promise) {
          console.log("done waiting");
        }
      }
    }
  }
  async handleABISResetCurrentTestCaseFlow(startingForLoop: boolean) {
    let resetCurrentTestCase = true;
    if (this.projectType == appConstants.ABIS && startingForLoop) {
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
    return resetCurrentTestCase;
  }

  async handleSBIResumeAgainFlow(startingForLoop: boolean, testCase: TestCaseModel) {
    if (testCase.otherAttributes.resumeAgainBtn && startingForLoop) {
      this.showResumeAgainBtn = true;
      const promise = new Promise((resolve, reject) => { });
      if (await promise) {
        console.log("done waiting");
      }
    }
  }

  handleContinueBtnFlow(
    startingForLoop: boolean,
    testCase: TestCaseModel,
    allValidatorsPassed: boolean,
    res: any
  ) {
    if (
      startingForLoop &&
      this.projectType === appConstants.SBI &&
      (testCase.otherAttributes.keyRotationTestCase ||
        testCase.otherAttributes.hashValidationTestCase ||
        testCase.otherAttributes.qualityAssessmentTestCase)
    ) {
      let testcaseFailed = !allValidatorsPassed;
      if (!testcaseFailed) {
        const methodRespJson = JSON.parse(res.methodResponse);
        if (testCase.otherAttributes.keyRotationTestCase) {
          this.beforeKeyRotationResp = methodRespJson;
        }
        if (testCase.otherAttributes.hashValidationTestCase) {
          let hashArr: any[] = [];
          if (methodRespJson && methodRespJson.biometrics) {
            methodRespJson.biometrics.forEach((dataResp: any) => {
              hashArr.push(dataResp["hash"]);
            });
          }
          if (hashArr.length >= 1) {
            this.previousHash = hashArr[hashArr.length - 1];
          }
        }
        this.showContinueBtn = true;
        this.showLoader = false;
      } else {
        //update updateSuccessFailureCount
        this.progressDone =
          this.progressDone + 100 / this.testCasesList.length;
        this.updateSuccessFailureCount(allValidatorsPassed, testCase);
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
    let isTestRunSuccessful = false;
    if (this.countOfSuccessTestcases === this.testCasesList.length) {
      isTestRunSuccessful = true;
    }
    let isTestRunComplete = false;
    if (this.getIndexInList() + 1 === this.testCasesList.length) {
      isTestRunComplete = true;
    }
    this.endTestRunDt = new Date().toISOString();
    const testRunRequest = {
      id: this.testRunId,
      collectionId: this.collectionId,
      runDtimes: this.startTestRunDt,
      executionDtimes: this.endTestRunDt,
      executionStatus: isTestRunComplete ? appConstants.COMPLETE_STATUS : appConstants.INCOMPLETE_STATUS,
      runStatus: isTestRunSuccessful ? appConstants.SUCCESS : appConstants.FAILURE
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

  async addTestRunDetails(testCaseComplete: boolean, allValidatorsPassed: boolean, res: any, testCase: TestCaseModel) {
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
      validations = validationsList;
    }
    let resultStatus = appConstants.FAILURE;
    if (allValidatorsPassed) {
      resultStatus = appConstants.SUCCESS;
    } else {
      resultStatus = appConstants.FAILURE;
    }
    const testRunRequest = {
      runId: this.testRunId,
      testcaseId: testCase.testId,
      methodId: this.currentMethodId,
      methodUrl: res.methodUrl ? res.methodUrl : '',
      methodRequest: res.methodRequest,
      methodResponse: res.methodResponse,
      resultStatus: resultStatus,
      resultDescription: JSON.stringify({
        validationsList: validations,
      }),
      executionStatus: testCaseComplete ? appConstants.COMPLETE_STATUS : appConstants.INCOMPLETE_STATUS,
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
            if (testCaseComplete) {
              this.progressDone =
                this.progressDone + 100 / this.testCasesList.length;
            }
            resolve(true);
          },
          (errors) => {
            this.errorsInSavingTestRun = true;
            if (testCaseComplete) {
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
    //console.log(`executeSDKTestCase`);
    if (!this.sdkProjectData) {
      const sdkProjectDetails: any = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if (sdkProjectDetails) {
        this.sdkProjectData = sdkProjectDetails;
      }
    }
    localStorage.setItem(
      appConstants.SDK_PROJECT_URL,
      this.sdkProjectData ? this.sdkProjectData.url : ''
    );
    this.showLoader = true;
    let isCombinationTestCase = testCase.methodName.length > 1 ? true : false;
    let res = null;
    if (isCombinationTestCase) {
      if (this.currentMethodIndex == 0) {
        res = await this.sdkTestCaseService.runTestCase(
          testCase,
          this.sdkProjectData.url,
          this.sdkProjectData.bioTestDataFileName,
          0,
          null
        );
        this.currentMethodId = testCase.methodName[this.currentMethodIndex];
        this.firstMethodRespForSDK = res;
        this.currentMethodIndex++;
        if (this.currentMethodIndex > 1) {
          this.firstMethodRespForSDK = null;
          this.currentMethodIndex = 0;
        }
        return res;
      }
      if (this.currentMethodIndex == 1) {
        res = await this.sdkTestCaseService.runTestCase(
          testCase,
          this.sdkProjectData.url,
          this.sdkProjectData.bioTestDataFileName,
          1,
          this.firstMethodRespForSDK
        );
        this.currentMethodId = testCase.methodName[this.currentMethodIndex];
        this.firstMethodRespForSDK = null;
        this.currentMethodIndex = 0;
        return res;
      }
    } else {
      res = await this.sdkTestCaseService.runTestCase(
        testCase,
        this.sdkProjectData.url,
        this.sdkProjectData.bioTestDataFileName,
        0,
        null
      );
      this.currentMethodId = testCase.methodName[this.currentMethodIndex];
      this.firstMethodRespForSDK = null;
      this.currentMethodIndex = 0;
      return res;
    }

  }
  
  convertToUUIDFormat(nonUuidStr: string): string {
    console.log(`before ${nonUuidStr}`);
    //replace all underscores
    nonUuidStr = nonUuidStr.replace(/_/g, "");
    //slice to last 36 chars in string
    const getChar = (s:string, n:number) => s.slice(-n);
    let strWith36Chars = nonUuidStr;
    if (nonUuidStr.length > 36) {
      strWith36Chars = getChar(nonUuidStr, 36);
    }
    let part1 = strWith36Chars.substring(0,8);
    let part2 = strWith36Chars.substring(9,13);
    let part3 = strWith36Chars.substring(14,18);
    let part4 = strWith36Chars.substring(19,23);
    let part5 = strWith36Chars.substring(24,36);
    
    let uuidStr = part1 + "-" +  part2 + "-" + part3 + "-" + part4 + "-" + part5;
    console.log(`after ${uuidStr}`);
    
    return uuidStr;
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
      if (!this.abisProjectData) {
        const abisProjectDetails: any = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
        if (abisProjectDetails) {
          this.abisProjectData = abisProjectDetails;
        }
      }
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
        requestId = this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + testCase.testId);
        
        if (insertCount > 1) {
          //cbeffFileSuffix keeps track of the current CBEFF file index for a testcase
          if (this.cbeffFileSuffix == 0) {
            this.cbeffFileSuffix = 1;
          }
          requestId = this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + testCase.testId + appConstants.UNDERSCORE + this.cbeffFileSuffix);
        }
        //ABIS referenceId is unique per set of biometrics so set to testRunId_testcaseId
        referenceId = requestId;
      }

      let galleryIds: { referenceId: string; }[] = [];
      //if testcase defines identifyReferenceId, then it is used 
      if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        requestId = this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + testCase.testId + appConstants.UNDERSCORE + appConstants.ABIS_METHOD_IDENTIFY);
        if (testCase.otherAttributes.identifyReferenceId) {
          referenceId = this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + testCase.otherAttributes.identifyReferenceId);
        }
        if (testCase.otherAttributes.identifyGalleryIds) {
          testCase.otherAttributes.identifyGalleryIds.forEach((galleryId: string) => {
            galleryIds.push({
              "referenceId": this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + galleryId)
            });
          });
        }
      }
      //if testcase defines insertReferenceId, overwrite the above referenceId
      if (this.currentAbisMethod == appConstants.ABIS_METHOD_INSERT) {
        if (testCase.otherAttributes.insertReferenceId) {
          referenceId = this.convertToUUIDFormat(this.testRunId + appConstants.UNDERSCORE + testCase.otherAttributes.insertReferenceId);
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
        if (this.cbeffFileSuffix > 0) {
          this.currentMethodId = this.currentAbisMethod + "-" + this.cbeffFileSuffix;
        } else {
          this.currentMethodId = this.currentAbisMethod;
        }
        if (testCase.otherAttributes.insertReferenceId) {
          this.currentMethodId = this.currentAbisMethod;
        }
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
        if (!this.isCombinationAbisTestcase) {
          this.abisSentDataSource = abisReq.testDataSource;
        }
        //console.log(`this.abisSentDataSource ${this.abisSentDataSource}`);
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
      console.log("run validations on resp");
      this.showLoader = true;
      //run validations
      let methodIndex = 0;
      if (this.isCombinationAbisTestcase && this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        methodIndex = 1;
      }
      
      const validatorsResp = await this.abisTestCaseService.runValidators(testCase, this.checkIfTestCaseExecutionIsDone(testCase), this.abisProjectData, 
      this.currentAbisMethod, this.abisSentMessage, this.abisRecvdMessage, this.abisSentDataSource, methodIndex, this.testRunId);
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
            null,
            this.previousHash,
            this.testRunId,
            this.projectId
          );
        } else {
          res = await this.sbiTestCaseAndroidService.runTestCase(
            testCase,
            this.sbiDeviceType,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            null,
            this.previousHash,
            this.testRunId,
            this.projectId
          );
        }
        this.streamingDone = false;
        if (!this.isAndroidAppMode) {
          this.stopStreaming();
        }
        //resolve(res);
        this.setSBICurrentMethodId(testCase);
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
    }
    //discover & deviceInfo flows
    else {
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
            beforeKeyRotationDeviceResp,
            "",
            this.testRunId,
            this.projectId
          );
        } else {
          res = await this.sbiTestCaseAndroidService.runTestCase(
            testCase,
            this.sbiDeviceType,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : '',
            beforeKeyRotationDeviceResp,
            "",
            this.testRunId,
            this.projectId
          );
        }
        this.setSBICurrentMethodId(testCase);
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

  setSBICurrentMethodId(testCase: TestCaseModel) {
    if (testCase.otherAttributes.hashValidationTestCase
      || testCase.otherAttributes.qualityAssessmentTestCase
    ) {
      this.currentMethodId = testCase.methodName[0] + "-" + (this.currentMethodIndex + 1);
    }
    else if (testCase.otherAttributes.keyRotationTestCase
    ) {
      this.currentMethodId = testCase.methodName[0] + "-" + (this.currentMethodIndex);
    }
    else {
      this.currentMethodId = testCase.methodName[0];
    }
  }

  checkIfAllValidatorsPassed(res: any) {
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
    return allValidatorsPassed;
  }

  updateSuccessFailureCount(allValidatorsPassed: boolean, testCase: TestCaseModel) {
    if (allValidatorsPassed) {
      this.countOfSuccessTestcases++;
    } else {
      this.countOfFailedTestcases++;
    }
  }

  checkIfTestCaseExecutionIsDone(testCase: TestCaseModel) {
    let isTestCaseComplete = false;
    if (this.projectType == appConstants.SBI) {
      if (testCase.otherAttributes.keyRotationTestCase &&
        this.currentMethodIndex >= (this.keyRotationIterations - 1)) {
        isTestCaseComplete = true;
      }
      if (testCase.otherAttributes.qualityAssessmentTestCase &&
        this.currentMethodIndex >= (this.totalQATestCaseIterations - 1)) {
        isTestCaseComplete = true;
      }
      if (testCase.otherAttributes.hashValidationTestCase &&
        this.currentMethodIndex >= (this.hashValidatorIterations - 1)) {
        isTestCaseComplete = true;
      }
      if (
        !testCase.otherAttributes.keyRotationTestCase &&
        !testCase.otherAttributes.qualityAssessmentTestCase &&
        !testCase.otherAttributes.hashValidationTestCase
      ) {
        isTestCaseComplete = true;
      }
    }
    if (this.projectType == appConstants.ABIS) {
      if (!this.isCombinationAbisTestcase) {
        if (this.cbeffFileSuffix == 0) {
          isTestCaseComplete = true;
        }
      } else if (this.currentAbisMethod == appConstants.ABIS_METHOD_IDENTIFY) {
        isTestCaseComplete = true;
      }
    }
    if (this.projectType == appConstants.SDK) {
      if (this.currentMethodIndex == 0) {
        isTestCaseComplete = true;
      }
    }
    return isTestCaseComplete;
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
