import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import Utils from 'src/app/app.utils';
import { TranslateService } from '@ngx-translate/core';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/core/services/data-service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DialogComponent } from 'src/app/core/components/dialog/dialog.component';

export interface SubmittedProjects {
  projectName: string;
  orgName: string;
  projectType: string;
  collectionName: string;
  updDtimes: Date;
  reportStatus: string;
}

interface StatusIcon {
  icon: string;
  color: string;
}

@Component({
  selector: 'app-reports-submitted',
  templateUrl: './reports-submitted.component.html',
  styleUrls: ['./reports-submitted.component.css'],
})
export class ReportsSubmittedComponent implements OnInit {
  displayedColumns: string[] = [
    'projectName',
    'orgName',
    'projectType',
    'collectionName',
    'updDtimes',
    'reportStatus',
  ];
  dataSource = new MatTableDataSource<SubmittedProjects>();
  textDirection: any = this.userProfileService.getTextDirection();
  buttonPosition: any =
    this.textDirection == 'rtl' ? { float: 'left' } : { float: 'right' };
  resourceBundleJson: any = {};
  dataLoaded = false;
  subscriptions: Subscription[] = [];
  statusIcons: { [key: string]: StatusIcon } = {
    approved: { icon: 'check_circle', color: 'green' },
    rejected: { icon: 'cancel', color: 'red' },
    review: { icon: 'assignment', color: 'orange' },
  };

  @ViewChild(MatSort) sort: MatSort;
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

    this.resourceBundleJson = await Utils.getResourceBundle(
      this.userProfileService.getUserPreferredLanguage(),
      this.dataService
    );
    await this.getSubmittedReportList();
    this.dataLoaded = true;
    this.dataSource.sort = this.sort;
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = this.customFilterPredicate;
  }

  customFilterPredicate(data: SubmittedProjects, filter: string): boolean {
    const formattedDate = new Date(filter);
    const crDate = new Date(data.updDtimes);

    const nameMatch = data.projectName.trim().toLowerCase().includes(filter);
    const typeMatch = data.projectType.trim().toLowerCase().includes(filter);
    const dateMatch = crDate.toDateString() === formattedDate.toDateString();

    return nameMatch || typeMatch || dateMatch;
  }

  async getSubmittedReportList(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService.getSubmittedReportList().subscribe(
          (response: any) => {
            (async () => {
              const dataArr = response['response'];
              this.dataSource = new MatTableDataSource<SubmittedProjects>(
                dataArr
              );
              this.dataSource.sort = this.sort;
              resolve(true);
            })().catch((error) => reject(error));
          },
          (errors) => {
            Utils.showErrorMessage(
              this.resourceBundleJson,
              errors,
              this.dialog
            );
            resolve(false);
          }
        )
      );
    });
  }
}
