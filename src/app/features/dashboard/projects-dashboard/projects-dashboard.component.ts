import { OnInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import * as appConstants from 'src/app/app.constants';

export interface ProjectData {
  id: string;
  name: string;
  projectType: string;
  collectionsCount: number;
  crDate: Date;
  lastRunDt: Date;
  lastRunStatus: string;
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
    private dataService: DataService
  ) {}

  async ngOnInit() {
    
    await this.getProjects();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataLoaded = true;
  }

  async getProjects() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjects().subscribe((response: any) => {
          console.log(response);
          this.dataSource = new MatTableDataSource(
            response['response']['projects']
          );
          resolve(true);
        })
      );
    });
  }

  ngAfterViewInit() {}

  addProject() {
    this.router.navigate([`toolkit/project/add`]);
  }

  viewProject(project: any) {
    if ((project.projectType == appConstants.SBI)) {
      this.router.navigate([`toolkit/project/${project.projectType}/${project.id}`]);
    }
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
