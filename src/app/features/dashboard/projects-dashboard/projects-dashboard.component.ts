import { OnInit, Component, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute, Router} from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';

export interface ProjectData {
  id: string;
  name: string;
  projectType: string;
  collectionsCount: number;
  crDate: Date;
  lastRunDt: Date;
  lastRunStatus: string;
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

  constructor(
    private router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dialog: MatDialog,
    private userProfileService: UserProfileService,
    private dataService: DataService,
    private paginatorIntl: MatPaginatorIntl
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    this.paginatorIntl.itemsPerPageLabel = this.resourceBundleJson.paginationLabel['itemPerPage'];
    this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      const from = (page) * pageSize + 1;
      const to = Math.min((page + 1) * pageSize, length);
      return `${from} - ${to} ${this.resourceBundleJson.paginationLabel['rangeLabel']} ${length}`;
    };
    await this.getProjects();
    this.initBreadCrumb();
    this.dataLoaded = true;
    this.dataSource.paginator = this.paginator;
    this.sort.sort(({ id: 'lastRunDt', start: 'desc'}) as MatSortable);
    this.dataSource.sort = this.sort;
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
                console.log(response);
                let dataArr = response['response']['projects'];
                let tableData = [];
                for (let row of dataArr) {
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
      await this.getSbiProjectDetails(project.id);
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
      await this.getSdkProjectDetails(project.id);
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
      await this.getAbisProjectDetails(project.id);
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
  
  async getSbiProjectDetails(projectId: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSbiProject(projectId).subscribe(
          (response: any) => {
            this.projectFormData = response['response'];
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

  async getSdkProjectDetails(projectId: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSdkProject(projectId).subscribe(
          (response: any) => {
            this.projectFormData = response['response'];
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

  async getAbisProjectDetails(projectId: any) {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getAbisProject(projectId).subscribe(
          (response: any) => {
            this.projectFormData = response['response'];
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
    const filterValue = (event.target as HTMLInputElement).value;
    console.log(filterValue);
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
