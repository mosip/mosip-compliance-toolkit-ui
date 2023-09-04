import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { AuthguardService } from './core/services/authguard.service';

const routes: Routes = [
  { path: '', redirectTo: 'toolkit', pathMatch: 'full' },
  {
    path: 'toolkit',
    component: MainLayoutComponent,
    data: { 
      breadcrumb: {
        alias: 'homeBreadCrumb',
      }, 
    },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'admin-console',
        loadChildren: () =>
          import('./features/admin/admin.module').then(
            (m) => m.AdminModule
          ),
      },
      {
        path: 'dashboard',
        data: { breadcrumb: { label: 'dashboard', skip: true } },
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'project',
        data: { breadcrumb: { label: 'Project', skip: true } },
        loadChildren: () =>
          import('./features/project/project.module').then(
            (m) => m.ProjectModule
          ),
      },
      {
        path: 'biometrics',
        data: { breadcrumb: { label: 'Biometrics', skip: true } },
        loadChildren: () =>
          import('./features/test-data/test-data.module').then(
            (m) => m.TestDataModule
          ),
      },
    ],
    canActivateChild: [AuthguardService],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      onSameUrlNavigation: 'reload',
      enableTracing: false,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
