import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';
import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { I18nModule } from '../../i18n.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BiometricDashboardComponent } from './biometric-dashboard/biometric-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import {MatTabsModule} from '@angular/material/tabs';
import { ReportsSubmittedComponent } from './reports-submitted/reports-submitted.component';

@NgModule({
  declarations: [
    ProjectsDashboardComponent,
    BiometricDashboardComponent,
    AdminDashboardComponent,
    ReportsSubmittedComponent,
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
