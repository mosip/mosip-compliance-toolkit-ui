import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppConfigService } from './app-config.service';
import { AppRoutingModule } from './app-routing.module';
import { I18nModule } from './i18n.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './core/material.module';
import { CookieService } from 'ngx-cookie-service';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTabsModule } from '@angular/material/tabs';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/authservice.service';
import { AuthguardService } from './core/services/authguard.service';
import { CoreModule } from './core/core.module';
import { environment } from 'src/environments/environment';
import { ErrorPageComponent } from './error-page/error-page.component';

const appInitialization = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
  };
};

let imports = [
  BrowserModule,
  RouterModule,
  AppRoutingModule,
  BrowserAnimationsModule,
  MaterialModule,
  FormsModule,
  ReactiveFormsModule,
  I18nModule,
  MatTabsModule,
  HttpClientModule
]

if (environment.isAndroidAppMode == 'yes') {
  imports.push(CoreModule);
}

@NgModule({
  declarations: [AppComponent, LandingPageComponent, ErrorPageComponent],
  imports: imports,
  providers: [
    CookieService,
    AuthService,
    AuthguardService,
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitialization,
      multi: true,
      deps: [AppConfigService],
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
