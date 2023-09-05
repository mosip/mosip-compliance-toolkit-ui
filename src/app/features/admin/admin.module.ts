import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminConsoleComponent } from './admin-console/admin-console.component';
import { PartnersDashboardComponent } from './partners-dashboard/partners-dashboard.component';
import { TestcaseDashboardComponent } from './testcase-dashboard/testcase-dashboard.component';
import { MaterialModule } from 'src/app/core/material.module';
import { AdminRoutingModule } from './admin-routing.module';
import { I18nModule } from 'src/app/i18n.module';
import { ComplianceCollectionsDashboardComponent } from './compliance-collections-dashboard/compliance-collections-dashboard.component';



@NgModule({
  declarations: [
    AdminConsoleComponent,
    PartnersDashboardComponent,
    TestcaseDashboardComponent,
    ComplianceCollectionsDashboardComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    AdminRoutingModule,
    I18nModule
  ]
})
export class AdminModule { }
