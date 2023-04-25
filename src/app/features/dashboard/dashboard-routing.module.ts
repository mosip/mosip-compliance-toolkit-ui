import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BiometricDashboardComponent } from './biometric-dashboard/biometric-dashboard.component';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsDashboardComponent,
    data: { 
      breadcrumb: {
        alias: 'projectDashboardBreadCrumb',
      },
    },
  },
  {
    path: 'biometric',
    component: BiometricDashboardComponent,
    data: { 
      breadcrumb: {
        alias: 'biometricDashboardBreadCrumb',
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
