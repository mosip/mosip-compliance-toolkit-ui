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
import { from, lastValueFrom, Observable } from 'rxjs';
import { LoginRedirectService } from './loginredirect.service';
import { AppConfigService } from 'src/app/app-config.service';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import jwt_decode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import * as appConstants from 'src/app/app.constants';
import { environment } from 'src/environments/environment';
import { AndroidKeycloakService } from './android-keycloak';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  errorMessages: any;
  decoded: any;

  showHomePage = async (isAndroidAppMode: boolean) => {
    if (!isAndroidAppMode) {
      sessionStorage.clear();
      localStorage.clear();
      this.cookieService.deleteAll();
      this.redirectService.redirect(window.location.href);
    } else {
      await Preferences.remove({ key: appConstants.ACCESS_TOKEN });
      await this.androidKeycloakService.getInstance().login();
    }
  }

  constructor(
    private redirectService: LoginRedirectService,
    private appConfigService: AppConfigService,
    private cookieService: CookieService,
    private userProfileService: UserProfileService,
    private androidKeycloakService: AndroidKeycloakService
  ) { }
  // function which will be called for all http calls
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // convert promise to observable using 'from' operator
    return from(this.handle(request, next));
  }

  async handle(request: HttpRequest<any>, next: HttpHandler) {
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
    if (!isLocalUrl) {
      if (!isAndroidAppMode) {
        //for web application
        request = request.clone({ withCredentials: true });
        request = request.clone({
          setHeaders: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
        });
      } else {
        //for android app
        const accessToken = await Preferences.get({ key: appConstants.ACCESS_TOKEN });
        const authToken = accessToken.value ? accessToken.value : '';
        request = request.clone({
          setHeaders: { [appConstants.AUTHORIZATION]: authToken },
        });
      }
    }
    if (request.url.includes('i18n') && !isAndroidAppMode) {
      isLocalUrl = true;
    }
    return lastValueFrom(next.handle(request).pipe(
      tap(
        async (event) => {
          if (event instanceof HttpResponse) {
            if (event.url && event.url.split('/').includes('validateToken')) {
              if (event.body.response) {
                this.decoded = jwt_decode(event.body.response.token);
                this.userProfileService.setDisplayUserName(
                  this.decoded['name']
                );
                this.userProfileService.setUsername(event.body.response.userId);
                this.userProfileService.setRoles(event.body.response.role);
                this.userProfileService.setUserPreferredLanguage(
                  this.decoded['locale']
                );
              }
              if (
                event.body.errors !== null &&
                event.body.errors.length > 0 &&
                (event.body.errors[0]['errorCode'] ===
                  appConstants.AUTH_ERROR_CODE[0] ||
                  event.body.errors[0]['errorCode'] ===
                  appConstants.AUTH_ERROR_CODE[1])
              ) {
                await this.showHomePage(isAndroidAppMode);
              }
            }
          }
        },
        async (err) => {
          if (err instanceof HttpErrorResponse) {
            if (!isLocalUrl) {
              console.log("token is invalid");
              await this.showHomePage(isAndroidAppMode);
            }
          }
        }
      )
    ));
  }
}


