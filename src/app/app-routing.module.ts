import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { environment } from 'src/environments/environment';
const routes: Routes = [
  {
    path: '',
    redirectTo: environment.isAndroidAppMode == 'yes' ? 'toolkit' : 'landing', pathMatch: 'full',
  },
  {
    path: 'landing',
    component:
      LandingPageComponent, pathMatch: 'full',
  },
  {
    path: 'toolkit',
    loadChildren: () =>
      import('./main-app/main-app.module').then(
        (m) => m.MainAppModule
      )
  }
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
export class AppRoutingModule { }
