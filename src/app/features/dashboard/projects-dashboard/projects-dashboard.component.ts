import { OnInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.getProjects();
    this.dataLoaded = true;
    this.dataSource.paginator = this.paginator;
    this.sort.sort(({ id: 'lastRunDt', start: 'desc'}) as MatSortable);
    this.dataSource.sort = this.sort;
  }

  async getProjects() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjects().subscribe(
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
