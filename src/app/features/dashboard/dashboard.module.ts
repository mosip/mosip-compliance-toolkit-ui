import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbModule, BreadcrumbService } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { I18nModule } from '../../i18n.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';
import { BiometricDashboardComponent } from './biometric-dashboard/biometric-dashboard.component';
import { PartnerReportsComponent } from './partner-reports/partner-reports.component';
import { MyReportsComponent } from './my-reports/my-reports.component';

@NgModule({
  declarations: [
    ProjectsDashboardComponent,
    BiometricDashboardComponent,
    PartnerReportsComponent,
    MyReportsComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    BreadcrumbModule,
    MaterialModule,
    FormsModule,
    I18nModule,
    ReactiveFormsModule,
    MatTabsModule
  ],
  providers: [BreadcrumbService]
})
export class DashboardModule { }
