import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { Subscription } from 'rxjs';
import { CdTimerComponent } from 'angular-cd-timer';
import { SbiTestCaseService } from '../../../core/services/sbi-testcase-service';
import { TestCaseModel } from 'src/app/core/models/testcase';
import Utils from 'src/app/app.utils';
import { Router } from '@angular/router';

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
  collectionName: string;
  errInFetchingTestcases = false;
  subscriptions: Subscription[] = [];
  scanComplete = true;
  runComplete = false;
  currectTestCaseId: string;
  currectTestCaseName: string;
  errorsExist = false;
  errorsSummary = '';
  testCasesList: any;
  testRunId: string;
  dataLoaded = false;
  @ViewChild('basicTimer', { static: true }) basicTimer: CdTimerComponent;
  countOfSuccessTestcases = 0;
  countOfFailedTestcases = 0;

  constructor(
    private dialogRef: MatDialogRef<ExecuteTestRunComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private router: Router,
    private sbiTestCaseService: SbiTestCaseService,
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
    if (this.projectType == appConstants.SBI && this.scanComplete) {
      await this.getCollection();
      await this.getTestcasesForCollection();
      this.dataLoaded = true;
      if (!this.errInFetchingTestcases) {
        this.basicTimer.reset();
        await this.executeRun();
        this.basicTimer.stop();
      }
    }
  }

  async getCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getCollection(this.collectionId).subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              this.errInFetchingTestcases = true;
              resolve(true);
            }
            this.collectionName = response['response']['name'];
            resolve(true);
          },
          (errors) => {
            this.errInFetchingTestcases = true;
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
              this.errInFetchingTestcases = true;
              resolve(true);
            }
            console.log(response);
            this.testCasesList = response['response']['testcases'];
            resolve(true);
          },
          (errors) => {
            this.errInFetchingTestcases = true;
            resolve(true);
          }
        )
      );
    });
  }
  async executeRun() {
    const sbiSelectedPort = localStorage.getItem(
      appConstants.SBI_SELECTED_PORT
    );
    const sbiSelectedDevice = localStorage.getItem(
      appConstants.SBI_SELECTED_DEVICE
    );
    this.errorsExist = false;
    if (sbiSelectedPort && sbiSelectedDevice) {
      const testCasesList: TestCaseModel[] = this.testCasesList;
      for (const testCase of testCasesList) {
        this.currectTestCaseId = testCase.testId;
        this.currectTestCaseName = testCase.testName;
        let res: any = null;
        console.log('executing testcase: ' + testCase.testName);
        if (this.projectType == appConstants.SBI) {
          res = await this.sbiTestCaseService.runTestCase(
            testCase,
            sbiSelectedPort,
            sbiSelectedDevice
          );
          this.currectTestCaseId = '';
          this.currectTestCaseName = '';
        }
        this.calculateTestcaseResults(res);
        //save the testrun
        //TODO
        this.testRunId = "100";
      }
      this.runComplete = true;
    } else {
      this.scanComplete = false;
    }
  }

  calculateTestcaseResults(res: any) {
    let allValidatorsPassed = false;
    if (res && res['response']) {
      let countofPassedValidators = 0;
      const response = res['response'];
      const errors = res['errors'];
      if (errors && errors.length > 0) {
        this.errorsExist = true;
        errors.forEach((err: any) => {
          this.errorsSummary = err['errorCode'] + ' - ' + err['message'];
        });
      } else {
        const validationsList = response['validationsList'];
        if (validationsList) {
          validationsList.forEach((validationitem: any) => {
            if (validationitem.status == 'success') {
              countofPassedValidators++;
            }
          });
          if (validationsList.length == countofPassedValidators) {
            allValidatorsPassed = true;
          }
        }
      }
    }
    if (allValidatorsPassed) {
      this.countOfSuccessTestcases++;
    } else {
      this.countOfFailedTestcases++;
    }
  }

  close() {
    this.dialogRef.close();
  }
  saveTestRun() {}

  viewTestRun() {
    this.dialogRef.close();
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}/collection/${this.collectionId}/testrun/${this.testRunId}`,
    ]);
  }
}
