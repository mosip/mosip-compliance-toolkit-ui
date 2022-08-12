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
  dataSource: MatTableDataSource<TestCaseModel>;
  selection = new SelectionModel<TestCaseModel>(true, []);
  displayedColumns: string[] = [
    'actions',
    'testId',
    'testName',
    'testDescription',
    'validatorDefs'
  ];
  dataSubmitted = false;
  
  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    this.initForm();
    await this.initProjectIdAndType();
    if (this.projectType == appConstants.SBI) {
      await this.getSbiProjectDetails();
      await this.getSbiTestcases();
      this.initBreadCrumb();
    }
    this.dataLoaded = true;
  }

  initBreadCrumb() {
    if (this.sbiProjectData) {
      this.breadcrumbService.set(
        '@projectBreadCrumb',
        `${this.projectType} Project - ${this.sbiProjectData.name}`
      );
      this.breadcrumbService.set(
        '@collectionBreadCrumb',
        `Add`
      );
    }
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
              let testcases = response['response'];
              //sort the testcases based on the testId
              testcases.sort(function (a: TestCaseModel, b: TestCaseModel) {
                if (a.testId > b.testId) return 1;
                if (a.testId < b.testId) return -1;
                return 0;
              });
              this.dataSource = new MatTableDataSource(testcases);
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

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
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
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.testId + 1
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
