import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';

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
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProjectComponent } from './components/project/project.component';

@NgModule({
  imports: [BreadcrumbModule, CommonModule, MaterialModule, RouterModule, HttpClientModule, FormsModule, ReactiveFormsModule, BrowserModule],
  declarations: [HomeComponent, MainLayoutComponent, HeaderComponent, DashboardComponent, ProjectComponent],
  exports: [
    HomeComponent,
    MainLayoutComponent,
    HeaderComponent,
    MaterialModule,
    RouterModule,
    FormsModule, 
    ReactiveFormsModule,
    BrowserModule,
    BreadcrumbModule
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
    BreadcrumbService
  ],
})
export class CoreModule {}
