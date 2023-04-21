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
import Utils from 'src/app/app.utils';
import { TestRunModel } from 'src/app/core/models/testrun';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import * as moment from 'moment';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { TestCaseModel } from 'src/app/core/models/testcase';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';

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
  runId: string;
  projectId: string;
  projectType: string;
  collectionForm = new FormGroup({});
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  testcasesList: any;
  dataSource: MatTableDataSource<TestRunModel>;
  displayedColumns: string[] = ['testId', 'testName', 'resultStatus', 'scrollIcon'];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];
  expandedElement: TestRunModel | null;
  dataSubmitted = false;
  panelOpenState = false;
  runDetails: any;
  textDirection: any = this.userProfileService.getTextDirection();
  resourceBundleJson: any = {};
  langCode = this.userProfileService.getUserPreferredLanguage();

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private userProfileService: UserProfileService,
    private translate: TranslateService
  ) { }

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.dataService.getResourceBundle(this.userProfileService.getUserPreferredLanguage()).subscribe(
      (response: any) => {
        this.resourceBundleJson = response;
      }
    );
    await this.initAllParams();
    await this.getCollection();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
    }
    if (this.projectType == appConstants.SDK) {
      await this.getSdkProjectDetails();
    }
    await this.getTestcasesForCollection();
    await this.getTestRun();
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
      });
      resolve(true);
    });
  }

  initBreadCrumb() {
    if (this.sbiProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sbiProjectData.name}`
      );
    }
    if (this.sdkProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sdkProjectData.name}`
      );
    }
    this.breadcrumbService.set(
      '@collectionBreadCrumb',
      `${this.collectionName}`
    );
    this.breadcrumbService.set(
      '@testrunBreadCrumb',
      `Test Run - (${new Date(this.runDetails.runDtimes).toLocaleString()})`
    );
  }

  async getTestRun() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunDetails(this.runId).subscribe(
          async (response: any) => {
            this.runDetails = response['response'];
            let list: any[] = response['response']['testRunDetailsList'];
            let tableData = [];
            this.testcasesList;
            for (const testCase of this.testcasesList) {
              let testRunData = null;
              for (const testRun of list) {
                if (testRun.testcaseId == testCase.testId) {
                  testRunData = testRun;
                }
              }
              tableData.push({
                testCaseType: testCase.testCaseType,
                testName: testCase.testName,
                testId: testCase.testId,
                testDescription: testCase.testDescription,
                methodName: testRunData
                  ? testRunData.methodName
                  : testCase.methodName,
                methodRequest: testRunData
                  ? testRunData.methodRequest
                  : 'No data available',
                methodResponse: testRunData
                  ? testRunData.methodResponse
                  : 'No data available',
                resultStatus: testRunData
                  ? testRunData.resultStatus
                  : 'failure',
                resultDescription: testRunData
                  ? testRunData.resultDescription
                  : '',
                testDataSource:
                  testRunData && testRunData.testDataSource
                    ? testRunData.testDataSource
                    : '',
                methodUrl:
                  testRunData && testRunData.methodUrl
                    ? testRunData.methodUrl
                    : '',
              });
            }
            this.dataSource = new MatTableDataSource(tableData);
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

  async getCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getCollection(this.collectionId).subscribe(
          (response: any) => {
            this.collectionName = response['response']['name'];
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

  async getTestcasesForCollection() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestcasesForCollection(this.collectionId).subscribe(
          (response: any) => {
            //console.log(response);
            let testcases = response['response']['testcases'];
            //sort the testcases based on the testId
            if (testcases && testcases.length > 0) {
              testcases.sort(function (a: TestCaseModel, b: TestCaseModel) {
                if (a.testId > b.testId) return 1;
                if (a.testId < b.testId) return -1;
                return 0;
              });
            }
            this.testcasesList = testcases;
            if (this.userProfileService.getUserPreferredLanguage()) {
              let testcasesListTranslated = [];
              for (let testcase of this.testcasesList) {
                testcasesListTranslated.push(Utils.translateTestcase(testcase, this.resourceBundleJson));
              }
              this.testcasesList = testcasesListTranslated;
            }
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
          (errors: any) => {
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  getValidationsList(row: any): any[] {
    if (row.resultDescription != '') {
      let jsonData = JSON.parse(row.resultDescription);
      let list = jsonData['validationsList'];
      return list;
    } else {
      let data = [];
      for (const testcase of this.testcasesList) {
        if (testcase.testId == row.testId) {
          for (const validator of testcase.validatorDefs) {
            data.push({
              validatorName: validator.name,
              validatorDescription: validator.description,
              status: 'failure',
              description: 'No data available',
            });
          }
        }
      }
      return data;
    }
  }

  getValidatorMessage(item: any) {
    
    const COMMA_SEPARATOR = ',';
    const validatorMessages = this.resourceBundleJson["validatorMessages"];
    let descriptionKeyString = item.descriptionKey;
    let translatedMsg = '';
    if (item && item.description && descriptionKeyString && this.resourceBundleJson &&
      validatorMessages) {
      //case 1 "VALIDATOR_MSG_001"
      //case 2 "VALIDATOR_MSG_001::arg1"
      //case 3 "VALIDATOR_MSG_001::arg1;arg2"
      //case 4 "VALIDATOR_MSG_001::VALIDATOR_MSG_002;arg2"
      //case 5 "VALIDATOR_MSG_001,VALIDATOR_MSG_002::arg1;arg2,VALIDATOR_MSG_003::arg3"
      //case 6 "VALIDATOR_MSG_001,textMessage,VALIDATOR_MSG_003::arg3"
      //Eg: descriptionKeyString = "ISO_VALIDATOR_003,ISO_VALIDATOR_004::0x46495200,ISO_VALIDATOR_005::0x46495201";
      const descriptionKeyArr = descriptionKeyString.split(COMMA_SEPARATOR);
      descriptionKeyArr.forEach((descriptionKey: any) => {
        translatedMsg = translatedMsg + this.performTranslation(descriptionKey, validatorMessages);
      });
      return translatedMsg;
    }
    if (item) {
      return item.description;
    } else {
      return "";
    }
  }

  performTranslation(descriptionKey: any, validatorMessages: any) {
    const COLON_SEPARATOR = '::', SEMI_COLON_SEPARATOR = ';', JSON_PLACEHOLDER = '{}';
    let translatedMsg = '';
    //check if the descriptionKey is having any rutime attributes
    //eg: descriptionKey="SCHEMA_VALIDATOR_001::name,size"
    if (descriptionKey.indexOf(COLON_SEPARATOR) == -1) {
      translatedMsg = validatorMessages[descriptionKey] ? validatorMessages[descriptionKey] : descriptionKey;
      return translatedMsg;
    } else {
      //create an arr of attributes
      let descriptionKeyArr = descriptionKey.split(COLON_SEPARATOR);
      const descriptionKeyName = descriptionKeyArr[0];
      const argumentsArr = descriptionKeyArr[1].split(SEMI_COLON_SEPARATOR);
      translatedMsg = validatorMessages[descriptionKeyName];
      const matches: RegExpMatchArray | null = translatedMsg.match(/\{\}/g);
      const count: number = matches ? matches.length : 0;
      //match no of palceholders in JSON value to no of arguments
      if (count != argumentsArr.length) {
        return translatedMsg;
      }
      let translatedMsgArray = translatedMsg.split(JSON_PLACEHOLDER);
      if (translatedMsgArray.length > 0) {
        let newTranslatedMsg = "";
        translatedMsgArray.forEach((element, index) => {
          if (argumentsArr.length > index) {
            // check if the argument is actually a key in resource bundle, 
            // eg: descriptionKey="SCHEMA_VALIDATOR_001::SCHEMA_VALIDATOR_002;SCHEMA_VALIDATOR_003"
            const arg = argumentsArr[index];
            const translatedArg = validatorMessages[arg];
            if (translatedArg) {
              newTranslatedMsg = newTranslatedMsg + element + translatedArg;
            } else {
              newTranslatedMsg = newTranslatedMsg + element + arg;
            }
          } else {
            newTranslatedMsg = newTranslatedMsg + element;
          }
        });
        return newTranslatedMsg;
      } else {
        return translatedMsg;
      }
    }

  }

  backToProject() {
    this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }
}
