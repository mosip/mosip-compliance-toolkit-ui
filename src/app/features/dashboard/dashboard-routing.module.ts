import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsDashboardComponent,
    data: { breadcrumb: 'Projects Dashboard' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
