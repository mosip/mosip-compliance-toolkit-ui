import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminConsoleComponent } from './admin-console/admin-console.component';
import { PartnersDashboardComponent } from './partners-dashboard/partners-dashboard.component';
import { TestcaseDashboardComponent } from './testcase-dashboard/testcase-dashboard.component';
import { CollectionsDashboardComponent } from './collections-dashboard/collections-dashboard.component';

const routes: Routes = [
  // { path: '', redirectTo: '', pathMatch: 'full'},
  {
    path: '',
    component: AdminConsoleComponent,
    children: [
      { path: '', redirectTo: 'partners', pathMatch: 'full' },
      { path: 'partners', component: PartnersDashboardComponent },
      { path: 'testcase', component: TestcaseDashboardComponent },
      { path: 'collections', component: CollectionsDashboardComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
