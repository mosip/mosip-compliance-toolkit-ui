import { OnInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute, Router} from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import Utils from 'src/app/app.utils';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { BreadcrumbService } from 'xng-breadcrumb';
import { TranslateService } from '@ngx-translate/core';

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
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any = this.textDirection == 'rtl' ? {'float': 'left'} : {'float': 'right'};
  resourceBundleJson: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService,
    private dialog: MatDialog,
    private dataService: DataService,
    private userProfileService: UserProfileService,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    this.translate.use(this.userProfileService.getUserPreferredLanguage());
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    await this.getListOfBiometricTestData();
    this.initBreadCrumb();
    this.dataSource.paginator = this.paginator;
    if (this.sort) {
      this.sort.sort({ id: 'crDate', start: 'desc' } as MatSortable);
    }
    this.dataSource.sort = this.sort;

    this.dataLoaded = true;
  }

  initBreadCrumb() {
    const breadcrumbLabels = this.resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      this.breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
      this.breadcrumbService.set('@biometricDashboardBreadCrumb', `${breadcrumbLabels.biometricTestData}`);
    }
  }
  
  async getListOfBiometricTestData(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getListOfBiometricTestData().subscribe(
          async (response: any) => {
            console.log(response);
            let dataArr = response['response'];
            this.dataSource = new MatTableDataSource(dataArr);
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

  async addTestData() {
    await this.router.navigate([`toolkit/biometrics/add`]);
  }

  downloadTestDataFile(row: any) {
    const fileId = row.id;
    const subs = this.dataService.getBiometricTestDataFile(fileId).subscribe(
      (res: any) => {
        if (res) {
          const fileByteArray = res;
          var blob = new Blob([fileByteArray], { type: 'application/zip' });
          var link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = row.fileId;
          link.click();
        } else {
          Utils.showErrorMessage(this.resourceBundleJson,
            null,
            this.dialog,
            'Unable to download ZIP file. Try Again!');
        }
      },
      (errors) => {
        Utils.showErrorMessage(this.resourceBundleJson ,errors, this.dialog);
      }
    );
    this.subscriptions.push(subs);
  }

  async showProjectsDashboard() {
    await this.router.navigate([`toolkit/dashboard`]);
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
