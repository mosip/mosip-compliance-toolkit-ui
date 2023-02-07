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
    const harcodedToken = "";
    if (!isLocalUrl) {
      if (!isAndroidAppMode) {
        request = request.clone({ withCredentials: true });
        request = request.clone({
          setHeaders: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
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
            //TODO alert ERROR
          }
        }
      )
    );
  }
}