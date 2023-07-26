import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { MaterialModule } from './material.module';
import { I18nModule } from '../i18n.module';
import { AuthInterceptor } from './services/httpinterceptor';
import { AuthService } from './services/authservice.service';
import { AuthguardService } from './services/authguard.service';
import { CanDeactivateGuardService } from './services/can-deactivate-guard.service';
import { SbiTestCaseService } from './services/sbi-testcase-service';
import { SdkTestCaseService } from './services/sdk-testcase-service';

import { LoginRedirectService } from './services/loginredirect.service';
import { DataService } from './services/data-service';
import { AndroidKeycloakService } from './services/android-keycloak';

import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { AbisTestCaseService } from './services/abis-testcase-service';
import { ActiveMqService } from './services/activemq-service';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, MaterialModule, RouterModule, HttpClientModule, ReactiveFormsModule],
  declarations: [HomeComponent, MainLayoutComponent, HeaderComponent, DialogComponent],
  exports: [
    HomeComponent,
    MainLayoutComponent,
    HeaderComponent,
    MaterialModule,
    I18nModule,
    RouterModule,
    DialogComponent
  ],
  providers: [
    DataService,
    AndroidKeycloakService,
    AuthService,
    LoginRedirectService,
    AuthguardService,
    CanDeactivateGuardService,
    SbiTestCaseService,
    SdkTestCaseService,
    AbisTestCaseService,
    ActiveMqService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {}
