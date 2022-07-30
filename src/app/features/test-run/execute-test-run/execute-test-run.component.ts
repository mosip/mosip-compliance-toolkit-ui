import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { Subscription } from 'rxjs';
import { CdTimerComponent } from 'angular-cd-timer';
import { SbiTestCaseService } from '../../../core/services/sbi-testcase-service';
import { TestCaseModel } from 'src/app/core/models/testcase';

@Component({
  selector: 'app-execute-test-run',
  templateUrl: './execute-test-run.component.html',
  styleUrls: ['./execute-test-run.component.css'],
})
export class ExecuteTestRunComponent implements OnInit {
  input: any;
  panelOpenState = false;
  subscriptions: Subscription[] = [];
  runComplete = false;
  currectTestCaseId: string;
  currectTestCaseName: string;
  @ViewChild('basicTimer', { static: true }) basicTimer: CdTimerComponent;

  constructor(
    private dialogRef: MatDialogRef<ExecuteTestRunComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private sbiTestCaseService: SbiTestCaseService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.input = this.data;
    this.basicTimer.start();
    this.executeRun();
    
  }

  async executeRun() {
    const sbiSelectedPort = localStorage.getItem(
      appConstants.SBI_SELECTED_PORT
    );
    const sbiSelectedDevice = localStorage.getItem(
      appConstants.SBI_SELECTED_DEVICE
    );
    if (sbiSelectedPort && sbiSelectedDevice) {
      const testCasesList: TestCaseModel[] = this.input.testCasesList;
      for (const testCase of testCasesList) {
        this.currectTestCaseId = testCase.testId;
        this.currectTestCaseName = testCase.testName;
        if (this.input.projectType == appConstants.SBI) {
          let res = await this.sbiTestCaseService.runTestCase(testCase, sbiSelectedPort, sbiSelectedDevice);
          if (res) {
            this.basicTimer.stop();
            this.runComplete = true;
          }
        }
      }
    } else {
      //TODO
    }
  }
  abort() {}

  saveTestRun(){}
}
