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

import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    HttpClientModule,
  ],
  declarations: [HomeComponent, MainLayoutComponent],
  exports: [HomeComponent, MainLayoutComponent, MaterialModule, RouterModule],
  providers: [DataService, AuthService, LoginRedirectService, AuthguardService,
    CanDeactivateGuardService, 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class CoreModule { }
