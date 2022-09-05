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

export interface BiometricsData {
  id: string;
  name: string;
  type: string;
  purpose: string;
  partnerId: string;
  fileId: string;
  crDate: Date;
}

@Component({
  selector: 'app-biometric-dashboard',
  templateUrl: './biometric-dashboard.component.html',
  styleUrls: ['./biometric-dashboard.component.css'],
})
export class BiometricDashboardComponent implements OnInit {
  dataSource: MatTableDataSource<BiometricsData>;
  displayedColumns: string[] = [
    'name',
    'type',
    'purpose',
    'fileId',
    'crDate',
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
    await this.getBiometricTestData();
    this.dataSource.paginator = this.paginator;
    this.sort.sort({ id: 'crDate', start: 'desc' } as MatSortable);
    this.dataSource.sort = this.sort;

    this.dataLoaded = true;
  }

  async getBiometricTestData() {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getBiometricTestData().subscribe(
          async (response: any) => {
            console.log(response);
            let dataArr = response['response'];
            this.dataSource = new MatTableDataSource(dataArr);
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
  
  addTestData() {
    this.router.navigate([`toolkit/biometrics/add`]);
  }

  viewTestData(row: any) {
    this.router.navigate([
      `toolkit/biometrics/${row.id}`,
    ]);
  }

  deleteProject(project: any) {
    alert('not available');
  }

  showProjectsDashboard() {
    this.router.navigate([`toolkit/dashboard`]);
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
