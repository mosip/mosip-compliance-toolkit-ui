import { OnInit, Component, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { environment } from 'src/environments/environment';
import { BreadcrumbService } from 'xng-breadcrumb';

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
    this.dataService.getResourceBundle(this.userProfileService.getUserPreferredLanguage()).subscribe(
      (response: any) => {
        this.resourceBundleJson = response;
        this.paginatorIntl.itemsPerPageLabel = this.resourceBundleJson.paginationLabel['itemPerPage'];
        this.paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
          const from = (page) * pageSize + 1;
          const to = Math.min((page + 1) * pageSize, length);
          return `${from} - ${to} ${this.resourceBundleJson.paginationLabel['rangeLabel']} ${length}`;
        };
      }
    );
    await this.getProjects();
    this.initBreadCrumb();
    this.dataLoaded = true;
    this.dataSource.paginator = this.paginator;
    this.sort.sort(({ id: 'lastRunDt', start: 'desc'}) as MatSortable);
    this.dataSource.sort = this.sort;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
    this.breadcrumbService.set('@projectDashboardBreadCrumb', `${breadcrumbLabels.projectsDashboard}`);

  }

  async getProjects() {
    let projectType = "";
    if (this.isAndroidAppMode) {
      projectType = appConstants.SBI;
    }
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjects(projectType).subscribe(
          async (response: any) => {
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
          },
          (errors) => {
            Utils.showErrorMessage(errors, this.dialog);
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
            Utils.showErrorMessage(errors, this.dialog);
            resolve(false);
          }
        )
      );
    });
  }
  ngAfterViewInit() {}

  addProject() {
    this.router.navigate([`toolkit/project/add`]);
  }

  viewProject(project: any) {
    if (this.isAndroidAppMode) {
      localStorage.removeItem(appConstants.SBI_SELECTED_PORT);
      localStorage.removeItem(appConstants.SBI_SELECTED_DEVICE);
      localStorage.removeItem(appConstants.SBI_SCAN_DATA);
      localStorage.removeItem(appConstants.SBI_SCAN_COMPLETE);
    }
    this.router.navigate([
      `toolkit/project/${project.projectType}/${project.id}`,
    ]);
  }
  
  showBiometricDashboard() {
    this.router.navigate([`toolkit/dashboard/biometric`]);
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
