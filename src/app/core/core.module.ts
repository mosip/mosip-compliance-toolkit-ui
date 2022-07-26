import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { MaterialModule } from './material.module';

import { AuthInterceptor } from './services/httpinterceptor';
import { AuthService } from './services/authservice.service';
import { AuthguardService } from './services/authguard.service';
import { CanDeactivateGuardService } from './services/can-deactivate-guard.service';

import { LoginRedirectService } from './services/loginredirect.service';
import { DataService } from './services/data-service';

import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  imports: [CommonModule, MaterialModule, RouterModule, HttpClientModule],
  declarations: [HomeComponent, MainLayoutComponent, HeaderComponent],
  exports: [
    HomeComponent,
    MainLayoutComponent,
    HeaderComponent,
    MaterialModule,
    RouterModule
  ],
  providers: [
    DataService,
    AuthService,
    LoginRedirectService,
    AuthguardService,
    CanDeactivateGuardService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {}
