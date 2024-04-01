import { OnInit, Component, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { Router} from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';
import { AppConfigService } from 'src/app/app-config.service';
import { Subscription } from 'rxjs';
import { SessionLogoutService } from 'src/app/core/services/session-logout.service';
import { FormControl, Validators } from '@angular/forms';

export interface ProjectData {
  id: string;
  name: string;
  projectType: string;
  collectionsCount: number;
  crDate: Date;
  lastRunDt: Date;
  lastRunStatus: string;
  isAndroidSbi: string;
  lastRunId: string;
}

@Component({
  selector: 'app-projects-dashboard',
  templateUrl: './projects-dashboard.component.html',
  styleUrls: ['./projects-dashboard.component.css'],
})
export class ProjectsDashboardComponent implements OnInit {
  dataSource: MatTableDataSource<ProjectData>;
  displayedColumns: string[] = [
    'name',
    'projectType',
    'collectionsCount',
    'crDate',
    'lastRunDt',
    'lastRunStatus',
    'actions',
  ];
  dataLoaded = false;
  projectFormData: any;
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : {'float': 'right'};
  resourceBundleJson: any = {};
  isAdmin: boolean = false;
  message:any = {};
  filterCtrl = new FormControl('', [Validators.pattern(/^[a-zA-Z0-9_\/\- ]*$/)]);
  
  constructor(
    private appConfigService: AppConfigService,
    private router: Router,
    private translate: TranslateService,
    private breadcrumbService: BreadcrumbService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService,
    private sessionLogoutService: SessionLogoutService
  ) {
  }

  async ngOnInit() {

    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    const adminRole = this.appConfigService.getConfig()['adminPartnerReportRole'];
    this.isAdmin = this.userProfileService.hasRole(adminRole);
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    await this.getProjects();
    this.initBreadCrumb();
    
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.sort.sort(({ id: 'lastRunDt', start: 'desc'}) as MatSortable);
    }
    this.dataSource.sort = this.sort;
    this.initConsent();
    this.dataLoaded = true;
    this.sessionIdleTimeout();
  }

  async initConsent() {
    let langCode = this.userProfileService.getUserPreferredLanguage();
    let templateName = appConstants.TERMS_AND_CONDTIONS_TEMPLATE;
    try {
      let latestTemplateVersion = await Utils.getLatestTemplateVersion(this.dataService, this.resourceBundleJson, this.dialog, templateName);
      let isConsentGiven = await Utils.isConsentGiven(this.dataService, this.resourceBundleJson, this.dialog, latestTemplateVersion);
      if (!isConsentGiven) {
        let template = await Utils.getTemplate(this.dataService, this.resourceBundleJson, this.dialog, langCode, templateName, latestTemplateVersion);
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '600px',
          data: {
            case: "TERMS_AND_CONDITIONS_CONSENT",
            consentTemplate: template,
          },
        });
      }
    } catch (errors: any) {
      console.error(errors[0].message);
    }
  }

  sessionIdleTimeout() {
    const subs = this.sessionLogoutService.currentMessageAutoLogout.subscribe(
      (message) => (this.message = message)
    );
    this.subscriptions.push(subs);
    if (!this.message["timerFired"]) {
      this.sessionLogoutService.getValues();
      this.sessionLogoutService.setValues();
      this.sessionLogoutService.keepWatching();
    } else {
      this.sessionLogoutService.getValues();
      this.sessionLogoutService.continueWatching();
    }
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
      this.breadcrumbService.set('@projectDashboardBreadCrumb', `${breadcrumbLabels.projectsDashboard}`);
    }
  }

  async getProjects(): Promise<boolean> {
    let projectType = "";
    if (this.isAndroidAppMode) {
      projectType = appConstants.SBI;
    }
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjects(projectType).subscribe(
          (response: any) => {
            (async () => {
                let dataArr = response['response']['projects'];
                let tableData = [];
                for (let row of dataArr) {
                  const isAndroidSbi = row["isAndroidSbi"];
                  let proceed = false;
                  if (this.isAndroidAppMode && "yes" == isAndroidSbi) {
                    proceed = true;
                  }
                  else if (!this.isAndroidAppMode && "no" == isAndroidSbi) {
                    proceed = true;
                  }
                  if (proceed) {
                    if (row.lastRunId) {
                      let runStatus = await this.getTestRunStatus(row.lastRunId);
                      tableData.push({
                        ...row,
                        lastRunStatus: runStatus,
                      });
                    } else {
                      tableData.push({
                        ...row,
                        lastRunStatus: '',
                      });
                    }
                  }
                }
                this.dataSource = new MatTableDataSource(tableData);
                resolve(true);
              })().catch((error) => reject(error));
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async getTestRunStatus(runId: string) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getTestRunStatus(runId).subscribe(
          (response: any) => {
            resolve(response['response']['resultStatus']);
          },
          (errors) => {
            Utils.showErrorMessage(this.resourceBundleJson, errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }

  async addProject() {
    await this.router.navigate([`toolkit/project/add`]);
  }

  async viewProject(project: any) {
    if (this.isAndroidAppMode) {
      localStorage.removeItem(appConstants.SBI_SELECTED_PORT);
      localStorage.removeItem(appConstants.SBI_SELECTED_DEVICE);
      localStorage.removeItem(appConstants.SBI_SCAN_DATA);
      localStorage.removeItem(appConstants.SBI_SCAN_COMPLETE);
    }
    if (project.projectType == appConstants.SBI) {
      this.projectFormData = await Utils.getSbiProjectDetails(project.id, this.dataService, this.resourceBundleJson, this.dialog);
      const sbiHash = this.projectFormData.sbiHash;
      const websiteUrl = this.projectFormData.websiteUrl;
      if (sbiHash == 'To_Be_Added' || websiteUrl == 'To_Be_Added') {
          await this.showUpdateProject(project.id, project.projectType);
      } else {
        await this.router.navigate([
          `toolkit/project/${project.projectType}/${project.id}`,
        ]);
      }
    } 
    if (project.projectType == appConstants.SDK) {
      this.projectFormData = await Utils.getSdkProjectDetails(project.id, this.dataService, this.resourceBundleJson, this.dialog);
      const sdkHash = this.projectFormData.sdkHash;
      const websiteUrl = this.projectFormData.websiteUrl;
      if (sdkHash == 'To_Be_Added'|| websiteUrl == 'To_Be_Added') {
        await this.showUpdateProject(project.id, project.projectType);
      } else {
        await this.router.navigate([
          `toolkit/project/${project.projectType}/${project.id}`,
        ]);
      }
    }
    if (project.projectType == appConstants.ABIS) {
      this.projectFormData = await Utils.getAbisProjectDetails(project.id, this.dataService, this.resourceBundleJson, this.dialog);
      const abisHash = this.projectFormData.abisHash;
      const websiteUrl = this.projectFormData.websiteUrl;
      if (abisHash == 'To_Be_Added'|| websiteUrl == 'To_Be_Added') {
        await this.showUpdateProject(project.id, project.projectType);
      } else {
        await this.router.navigate([
          `toolkit/project/${project.projectType}/${project.id}`,
        ]);
      }
    }
  }

  async showUpdateProject(projectId: any, projectType: any) { 
    const body = {
      case: 'UPDATE_PROJECT',
      id: projectId,
      projectType: projectType
    };
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '600px',
      data: body,
    });
    dialogRef.disableClose = false;
  }

  async showBiometricDashboard() {
    await this.router.navigate([`toolkit/dashboard/biometric`]);
  }

  deleteProject(project: any) {
    alert('not available');
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = this.customFilterPredicate;
  }

  customFilterPredicate(data: ProjectData, filter: string): boolean {
    const formattedDate = new Date(filter);
    const crDate = new Date(data.crDate);

    const nameMatch = data.name.trim().toLowerCase().includes(filter);
    const typeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const dateMatch = crDate.toDateString() === formattedDate.toDateString();

    return nameMatch || typeMatch || dateMatch;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
