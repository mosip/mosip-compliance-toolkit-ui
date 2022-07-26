import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { AuthguardService } from './core/services/authguard.service';
import { HomeComponent } from './core/components/home/home.component';
import { DashboardComponent } from './core/components/dashboard/dashboard.component';
import { ProjectComponent } from './core/components/project/project.component';

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
        component: DashboardComponent,
        data: { breadcrumb: ' Projects Dashboard' },
      },
      {
        path: 'project',
        component: ProjectComponent,
        data: { breadcrumb: 'Add a new Project' },
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
      onSameUrlNavigation: 'ignore',
      enableTracing: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
