import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';

@Component({
  selector: 'app-execute-test-run',
  templateUrl: './execute-test-run.component.html',
  styleUrls: ['./execute-test-run.component.css'],
})
export class ExecuteTestRunComponent implements OnInit {
  input: any;
  panelOpenState = false;
  subscriptions: Subscription[] = [];

  constructor(
    private dialogRef: MatDialogRef<ExecuteTestRunComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    this.input = this.data;
    // let testCasesList = [testcase];
    // if (this.projectType == appConstants.SBI) {
    //   let res = await this.sbiTestCaseService.runCollection(testCasesList);
    //   console.log(res);
    // }
  }
}
