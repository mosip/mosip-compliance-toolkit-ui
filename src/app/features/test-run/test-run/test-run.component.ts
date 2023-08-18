import { Component, OnInit } from '@angular/core';
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
import { TestCaseModel } from 'src/app/core/models/testcase';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { AbisProjectModel } from 'src/app/core/models/abis-project';

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
  abisProjectData: AbisProjectModel;
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
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    await this.initAllParams();
    this.collectionName = await Utils.getCollectionName(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
    if (this.projectType == appConstants.SBI) {
      const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sbiProjectDetails) {
        this.sbiProjectData = sbiProjectDetails;
      }
    }
    if (this.projectType == appConstants.SDK) {
      const sdkProjectDetails: any = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sdkProjectDetails) {
        this.sdkProjectData = sdkProjectDetails;
      }
    }
    if (this.projectType == appConstants.ABIS) {
      const abisProjectDetails: any = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(abisProjectDetails) {
        this.abisProjectData = abisProjectDetails;
      }
      this.initBreadCrumb();
    }
    this.testcasesList = await Utils.getTestcasesForCollection(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
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
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService,
        this.sbiProjectData, this.sdkProjectData, this.abisProjectData,
        this.projectType, this.collectionName);
      if (this.runDetails) {
        this.breadcrumbService.set(
          '@testrunBreadCrumb',
          `${breadcrumbLabels.testRun} - (${new Date(this.runDetails.runDtimes).toLocaleString()})`
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
        this.dataService.getTestRunDetails(this.runId).subscribe(
          (response: any) => {
            this.runDetails = response['response'];
            let list: any[] = response['response']['testRunDetailsList'];
            let tableData = [];
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
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
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

  downloadReport() {
  
    let reportrequest = {
      projectType: this.projectType,
      projectId: this.projectId,
      collectionId: this.collectionId,
      testRunId: this.runId
    }
    let request = {
      id: appConstants.CREATE_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: reportrequest,
    };
    const subs = this.dataService.createReport(request).subscribe(
      (res: any) => {
        if (res) {
          const fileByteArray = res;
          var blob = new Blob([fileByteArray], { type: 'application/pdf' });
          var link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = this.getProjectName();
          link.click();
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

  async backToProject() {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }
}
