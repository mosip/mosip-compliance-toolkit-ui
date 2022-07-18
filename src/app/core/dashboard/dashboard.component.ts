import {OnInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';

export interface ProjectData {
  'id': string,
  'name': string,
  'projectType': string,
  'collectionsCount': number,
  'crDate': Date,
  'lastRunDt': Date,
  'lastRunStatus': string
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
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
  subscriptions: Subscription[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  async ngOnInit() {
    await this.getProjects();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async getProjects() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getProjects().subscribe((response: any) => {
          console.log(response);
          this.dataSource = new MatTableDataSource(response['response']['projects']);
          resolve(true);
        })
      );
    });
  }

  ngAfterViewInit() {
    
  }

  addProject() {}

  editProject(project: any) {
    alert('you have selected to edit: ' + project.name);
  }

  deleteProject(project: any) {
    alert('you have selected to delete: ' + project.name);
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
