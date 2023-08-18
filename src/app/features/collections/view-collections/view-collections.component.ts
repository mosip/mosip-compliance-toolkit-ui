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
import { MatSort } from '@angular/material/sort';
import { TestCaseModel } from 'src/app/core/models/testcase';
import Utils from 'src/app/app.utils';
import { SdkProjectModel } from 'src/app/core/models/sdk-project';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { TranslateService } from '@ngx-translate/core';
import { AbisProjectModel } from 'src/app/core/models/abis-project';

@Component({
  selector: 'app-viewcollections',
  templateUrl: './view-collections.component.html',
  styleUrls: ['./view-collections.component.css'],
})
export class ViewCollectionsComponent implements OnInit {
  collectionId: string;
  collectionName: string;
  projectId: string;
  projectType: string;
  collectionForm = new FormGroup({});
  subscriptions: Subscription[] = [];
  dataLoaded = false;
  sbiProjectData: SbiProjectModel;
  sdkProjectData: SdkProjectModel;
  abisProjectData: AbisProjectModel;
  dataSource: MatTableDataSource<TestCaseModel>;
  displayedColumns: string[] = [
    'testId',
    'testName',
    'testDescription',
    'validatorDefs',
    'scrollIcon'
  ];
  dataSubmitted = false;
  @ViewChild(MatSort) sort: MatSort;
  textDirection: any = this.userProfileService.getTextDirection();
  resourceBundleJson: any = {};

  constructor(
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dataService: DataService,
    private userProfileService: UserProfileService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.initForm();
    await this.initAllParams();
    this.collectionName = await Utils.getCollectionName(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
    this.populateCollection();
    if (this.projectType == appConstants.SBI) {
      const sbiProjectDetails: any = await Utils.getSbiProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sbiProjectDetails) {
        this.sbiProjectData = sbiProjectDetails;
      }
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        this.sbiProjectData, null, null, this.projectType, this.collectionName);
    }
    if (this.projectType == appConstants.SDK) {
      const sdkProjectDetails: any = await Utils.getSdkProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(sdkProjectDetails) {
        this.sdkProjectData = sdkProjectDetails;
      }
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        null, this.sdkProjectData, null, this.projectType, this.collectionName);
    }
    if (this.projectType == appConstants.ABIS) {
      const abisProjectDetails: any = await Utils.getAbisProjectDetails(this.projectId, this.dataService, this.resourceBundleJson, this.dialog);
      if(abisProjectDetails) {
        this.abisProjectData = abisProjectDetails;
      }
      Utils.initBreadCrumb(this.resourceBundleJson, this.breadcrumbService, 
        null, null, this.abisProjectData, this.projectType, this.collectionName);
    }
    this.breadcrumbService.set(
      '@collectionBreadCrumb',
      `${this.collectionName}`
    );
    const testcaseArr = await Utils.getTestcasesForCollection(this.subscriptions, this.dataService, this.collectionId, this.resourceBundleJson, this.dialog);
    this.dataSource = new MatTableDataSource(testcaseArr);
    this.dataSource.sort = this.sort;
    this.dataLoaded = true;
  }

  initForm() {
    this.collectionForm.addControl(
      'name',
      new FormControl({ value: '', disabled: true }, [Validators.required])
    );
  }

  initAllParams() {
    return new Promise((resolve) => {
      this.activatedRoute.params.subscribe((param) => {
        this.projectId = param['projectId'];
        this.projectType = param['projectType'];
        this.collectionId = param['collectionId'];
      });
      resolve(true);
    });
  }

  populateCollection() {
    this.collectionForm.controls['name'].setValue(this.collectionName);
  }

  async backToProject() {
    await this.router.navigate([
      `toolkit/project/${this.projectType}/${this.projectId}`,
    ]);
  }
}
