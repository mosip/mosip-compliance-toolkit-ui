import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRedirectService } from './loginredirect.service';
import { Router } from '@angular/router';
import { AppConfigService } from 'src/app/app-config.service';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import jwt_decode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import * as appConstants from 'src/app/app.constants';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  errorMessages: any;
  decoded: any;
  showHomePage() {
    sessionStorage.clear();
    localStorage.clear();
    this.cookieService.deleteAll();
    this.redirectService.redirect(window.location.href);
  }
  constructor(
    private redirectService: LoginRedirectService,
    private router: Router,
    private appConfigService: AppConfigService,
    private cookieService: CookieService,
    private userProfileService: UserProfileService
  ) { }
  // function which will be called for all http calls
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    let isLocalUrl = false;
    if (this.appConfigService.getConfig() && !isAndroidAppMode) {
      const sbiUrl = this.appConfigService.getConfig()['SBI_BASE_URL'];
      const sdkUrl = localStorage.getItem(appConstants.SDK_PROJECT_URL);
      if (request.url.includes(sbiUrl)) {
        isLocalUrl = true;
      }
      if (sdkUrl && request.url.includes(sdkUrl)) {
        isLocalUrl = true;
      }
    }
    const harcodedToken = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJubEpTaUExM2tPUWhZQ0JxMEVKSkRlWnFTOGsybDB3MExUbmQ1WFBCZ20wIn0.eyJleHAiOjE2NzU3ODY5MzgsImlhdCI6MTY3NTc1MDkzOCwiYXV0aF90aW1lIjoxNjc1NzUwOTM4LCJqdGkiOiIzNzA0MWU3ZC1hYzkyLTRmZjktYjBiMS01YmQxMGU2YzY0NmYiLCJpc3MiOiJodHRwczovL2lhbS5kZXYubW9zaXAubmV0L2F1dGgvcmVhbG1zL21vc2lwIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImMwMzE1MjM5LTg3ZDMtNDE4ZS05N2Q1LWJjN2E2OWY1Yjk5YSIsInR5cCI6IkJlYXJlciIsImF6cCI6Im1vc2lwLXRvb2xraXQtY2xpZW50Iiwic2Vzc2lvbl9zdGF0ZSI6ImI0YmI1Mjc4LTY1YmMtNDk2OC05ZDZjLTc2MjM5YjQ0NTFjMiIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJQQVJUTkVSX0FETUlOIiwidW1hX2F1dGhvcml6YXRpb24iLCJHTE9CQUxfQURNSU4iLCJkZWZhdWx0LXJvbGVzLW1vc2lwIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwic2lkIjoiYjRiYjUyNzgtNjViYy00OTY4LTlkNmMtNzYyMzliNDQ1MWMyIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiTWF5dXJhIERlc2htdWtoIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF5dXJhZCIsImdpdmVuX25hbWUiOiJNYXl1cmEiLCJsb2NhbGUiOiJlbmciLCJmYW1pbHlfbmFtZSI6IkRlc2htdWtoIiwiZW1haWwiOiJtYXl1cmEuZGVzaG11a2hAZ21haWwuY29tIn0.IRbCw_K_wkU2prIrto2BVLbarqY5rVSPVBP-f4QgeJJgzIAlYlBrMv1zd_nXEhqTNvwhYaplXBwzgJ80Vlh4-uFvG9V2cPuus0WLgNqIk8--nDdw2mz50QSOAfAAEc9yRTb_OpTJq_uxQbJsxzgz7geMprip0NNu7bEex-EAonZNuLYBif1OMS1epG5UJ07h-xHr06jzie-vRlzb1noTTM3xwxe--ckllTF7CnSUS-fcKJsBWGJyOD7_y1HX6BOZk0FGNBjfUxRzvM6Mm6khEguz5p6r5yYEeps94tVVJP6R7gXjDehpKtE99D4YOjnjKfZNbrz5ZR_1U4ODP0y7KA";
    if (!isLocalUrl) {
      if (!isAndroidAppMode) {
        request = request.clone({
          setHeaders: {
            'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN')
          }
        });
      } else {
        request = request.clone({
          setHeaders: {
            'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN'),
            'Authorization': 'Authorization=' + harcodedToken
          }
        });
      }
    }
    if (request.url.includes('i18n')) {
      isLocalUrl = true;
    }
    return next.handle(request).pipe(
      tap(
        (event) => {
          if (event instanceof HttpResponse) {
            if (event.url && event.url.split('/').includes('validateToken')) {
              if (event.body.response) {
                if (!isAndroidAppMode) {
                  this.decoded = jwt_decode(event.body.response.token);
                  this.userProfileService.setDisplayUserName(
                    this.decoded['name']
                  );
                  this.userProfileService.setUsername(event.body.response.userId);
                  this.userProfileService.setRoles(event.body.response.role);
                  this.userProfileService.setUserPreferredLanguage(
                    this.decoded['locale']
                  );
                } else {
                  const token = harcodedToken;
                  this.decoded = jwt_decode(token);
                }
              }
              if (
                event.body.errors !== null &&
                event.body.errors.length > 0 &&
                (event.body.errors[0]['errorCode'] ===
                  appConstants.AUTH_ERROR_CODE[0] ||
                  event.body.errors[0]['errorCode'] ===
                  appConstants.AUTH_ERROR_CODE[1])
              ) {
                this.showHomePage();
              }
            }
          }
        },
        (err) => {
          if (err instanceof HttpErrorResponse) {
            if (!isLocalUrl) {
              this.showHomePage();
            }
            this.router.navigate([`toolkit/dashboard`]);
            //TODO alert ERROR
          }
        }
      )
    );
  }
}