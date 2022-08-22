import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { Subscription } from 'rxjs';
import { CdTimerComponent } from 'angular-cd-timer';
import { SbiTestCaseService } from '../../../core/services/sbi-testcase-service';
import { SdkTestCaseService } from '../../../core/services/sdk-testcase-service';
import { TestCaseModel } from 'src/app/core/models/testcase';
import { Router } from '@angular/router';
import { SbiProjectModel } from 'src/app/core/models/sbi-project';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';

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
  collectionName: string;
  subscriptions: Subscription[] = [];
  scanComplete = true;
  runComplete = false;
  validationErrMsg: string;
  currectTestCaseId: string;
  currectTestCaseName: string;
  errorsInGettingTestcases = false;
  serviceErrors = false;
  errorsInSavingTestRun = false;
  initiateCapture = false;
  showInitiateCaptureBtn = false;
  errorsSummary: string[];
  testCasesList: any;
  testRunId: string;
  dataLoaded = false;
  startTestRunDt: string;
  endTestRunDt: string;
  @ViewChild('basicTimer', { static: true }) basicTimer: CdTimerComponent;
  countOfSuccessTestcases = 0;
  countOfFailedTestcases = 0;
  sbiSelectedPort = localStorage.getItem(appConstants.SBI_SELECTED_PORT)
    ? localStorage.getItem(appConstants.SBI_SELECTED_PORT)
    : null;
  sbiSelectedDevice = localStorage.getItem(appConstants.SBI_SELECTED_DEVICE)
    ? localStorage.getItem(appConstants.SBI_SELECTED_DEVICE)
    : null;

  constructor(
    private dialogRef: MatDialogRef<ExecuteTestRunComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private router: Router,
    private sbiTestCaseService: SbiTestCaseService,
    private sdkTestCaseService: SdkTestCaseService,
    private appConfigService: AppConfigService
  ) {
    dialogRef.disableClose = true;
  }

  async ngOnInit() {
    this.input = this.data;
    this.collectionId = this.input.collectionId;
    this.projectType = this.input.projectType;
    this.projectId = this.input.projectId;
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
        if (this.sbiProjectData.purpose != selectedSbiDevice.purpose) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg =
            'Please select appropriate device, while scanning, to execute testcases for this project. \n The purpose of the selected device is not matching the project.';
          return false;
        }
        if (
          this.sbiProjectData.deviceType !=
          selectedSbiDevice.digitalIdDecoded.type
        ) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg =
            'Please select appropriate device, while scanning, to execute testcases for this project. \n The device type of the selected device is not matching the project.';
          return false;
        }
        if (
          this.sbiProjectData.deviceSubType !=
          selectedSbiDevice.digitalIdDecoded.deviceSubType
        ) {
          this.scanComplete = false;
          this.dataLoaded = true;
          this.validationErrMsg =
            'Please select appropriate device, while scanning, to execute testcases for this project. \n The device sub type of the selected device is not matching the project.';
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
            //console.log(response);
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
            //console.log(response);
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
            console.log(response);
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
    testCasesListSorted.sort(function (a: TestCaseModel, b: TestCaseModel) {
      if (a.testId > b.testId) return 1;
      if (a.testId < b.testId) return -1;
      return 0;
    });
    //first create a testrun in db
    await this.addTestRun();
    this.testCasesList = testCasesListSorted;
    if (!this.errorsInSavingTestRun) {
      await this.runExecuteForLoop(true);
    }
    this.runComplete = true;
    this.basicTimer.stop();
  }

  async runExecuteForLoop(proceedLoop: boolean) {
    for (const testCase of this.testCasesList) {
      let resumeTestRun = false;
      if (
        !proceedLoop &&
        this.currectTestCaseId != '' &&
        this.currectTestCaseId == testCase.testId
      ) {
        resumeTestRun = true;
      }
      if (resumeTestRun || proceedLoop) {
        proceedLoop = true;
        this.currectTestCaseId = testCase.testId;
        console.log(`this.currectTestCaseId: ${this.currectTestCaseId}`);
        this.currectTestCaseName = testCase.testName;
        if (!this.initiateCapture) {
          this.checkIfToShowInitiateCaptureBtn(testCase);
        }
        const res: any = await this.executeCurrentTestCase(testCase);
        if (res) {
          proceedLoop = this.handleErr(res);
          this.calculateTestcaseResults(res[appConstants.VALIDATIONS_RESPONSE]);
          //update the test run details in db
          await this.addTestRunDetails(testCase, res);
          //update the testrun in db with execution time
          await this.updateTestRun();
          this.currectTestCaseId = '';
          this.currectTestCaseName = '';
        }
      }
    }
  }

  handleErr(res: any) {
    console.log('handleErr');
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
      if (
        testCase.methodName == appConstants.SBI_METHOD_CAPTURE ||
        testCase.methodName == appConstants.SBI_METHOD_RCAPTURE
      ) {
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
      methodRequest: res.methodRequest,
      methodResponse: res.methodResponse,
      resultStatus: resultStatus,
      resultDescription: JSON.stringify({
        validationsList: validations,
      }),
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
            // console.log(response);
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
  async executeCurrentTestCase(testCase: TestCaseModel) {
    return new Promise(async (resolve, reject) => {
      console.log(`this.projectType ${this.projectType}`);
      if (this.projectType === appConstants.SBI) {
        console.log(testCase);
        if (
          testCase.methodName == appConstants.SBI_METHOD_CAPTURE ||
          testCase.methodName == appConstants.SBI_METHOD_RCAPTURE
        ) {
          if (this.initiateCapture) {
            this.initiateCapture = false;
            const res = await this.sbiTestCaseService.runTestCase(
              testCase,
              this.sbiSelectedPort ? this.sbiSelectedPort : '',
              this.sbiSelectedDevice ? this.sbiSelectedDevice : ''
            );
            resolve(res);
          } else {
            //resolve(false);
          }
        } else {
          const res = await this.sbiTestCaseService.runTestCase(
            testCase,
            this.sbiSelectedPort ? this.sbiSelectedPort : '',
            this.sbiSelectedDevice ? this.sbiSelectedDevice : ''
          );
          resolve(res);
        }
      } else if (this.projectType == appConstants.SDK) {
        await this.getSdkProjectDetails();
        localStorage.setItem(
          appConstants.SDK_PROJECT_URL,
          this.sdkProjectData ? this.sdkProjectData.sdkUrl : ''
        );
        const res = await this.sdkTestCaseService.runTestCase(
          testCase,
          this.sdkProjectData.sdkUrl
        );
        resolve(res);
      } else {
        resolve(true);
      }
    });
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
    if (allValidatorsPassed) {
      this.countOfSuccessTestcases++;
    } else {
      this.countOfFailedTestcases++;
    }
  }

  async setInitiateCapture() {
    this.initiateCapture = true;
    this.showInitiateCaptureBtn = false;
    await this.runExecuteForLoop(false);
    this.runComplete = true;
    this.basicTimer.stop();
  }

  close() {
    this.dialogRef.close('reloadProjectDetails');
  }

  viewTestRun() {
    this.dialogRef.close('');
    console.log(
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${this.testRunId}`
    );
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${this.testRunId}`,
    ]);
  }
}
