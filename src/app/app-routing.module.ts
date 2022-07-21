import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { MainLayoutComponent } from './core/components/main-layout/main-layout.component';
import { AuthguardService } from './core/services/authguard.service';
import { HomeComponent } from './core/components/home/home.component';
import { DashboardComponent } from './core/components/dashboard/dashboard.component';
import { ProjectComponent } from './core/components/project/project.component';

const routes: Routes = [
  { path: '', redirectTo: 'toolkit', pathMatch: 'full'},
  {
    path: 'toolkit',
    component: MainLayoutComponent,
    children: [
      // { path: '', redirectTo: 'home', pathMatch: 'full' },
      // { path: 'home', component: HomeComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'project', component: ProjectComponent },
    ],  
    canActivateChild : [AuthguardService]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      preloadingStrategy: PreloadAllModules,
      onSameUrlNavigation: 'reload',
      enableTracing: false
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}