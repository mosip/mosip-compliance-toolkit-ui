import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { AuthguardService } from './core/services/authguard.service';

const routes: Routes = [
  { path: '', redirectTo: 'toolkit', pathMatch: 'full' },
  {
    path: 'toolkit',
    component: MainLayoutComponent,
    data: { breadcrumb: 'Home' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'project',
        data: { breadcrumb: { label: 'Project', disable: true } },
        loadChildren: () =>
          import('./features/project/project.module').then(
            (m) => m.ProjectModule
          ),
      },
    ],
    canActivateChild: [AuthguardService],
  },
  {
    path: 'collections',
    loadChildren: () =>
      import('./features/collections/collections.module').then(
        (m) => m.CollectionsModule
      ),
  },
  { path: 'TestRun', loadChildren: () => import('./features/test-run/test-run.module').then(m => m.TestRunModule) },
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
