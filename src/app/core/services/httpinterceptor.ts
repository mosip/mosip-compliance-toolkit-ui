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
import { AppConfigService } from 'src/app/app-config.service';
import { UserProfileService } from 'src/app/core/services/user-profile.service';
import jwt_decode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import * as appConstants from 'src/app/app.constants';
import { environment } from 'src/environments/environment';
import { AndroidKeycloakService } from './android-keycloak';
import { CapacitorCookies } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  errorMessages: any;
  decoded: any;

  showHomePage = async (isAndroidAppMode: boolean) => {
    sessionStorage.clear();
    localStorage.clear();
    this.cookieService.deleteAll();
    if (!isAndroidAppMode) {
      this.redirectService.redirect(window.location.href);
    } else {
      await CapacitorCookies.deleteCookie({
        url: encodeURI(environment.SERVICES_BASE_URL),
        key: appConstants.AUTHORIZATION
      });
      await this.androidKeycloakService.getInstance().login();
    }
  }

  addCookieForAndroid = async () => {
    const accessToken = localStorage.getItem(appConstants.ACCESS_TOKEN);
    if (accessToken) {
      await CapacitorCookies.setCookie({
        url: encodeURI(environment.SERVICES_BASE_URL),
        key: appConstants.AUTHORIZATION,
        value: accessToken ? accessToken : '',
      });
      //console.log("cookie set for android");
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
        //for android 9,10,11 the Capacitor Cookies will set
        //the cookie header with token and 'withCredentials' work
        this.addCookieForAndroid();
        request = request.clone({ withCredentials: true });
        //for android 12+, the Capacitor Cookies and 'withCredentials' do not work
        //hence setting token as a new header 'accessToken'
        //this should be mapped to cookie header in nginx conf
        let accessToken = localStorage.getItem(appConstants.ACCESS_TOKEN);
        request = request.clone({
          setHeaders: { 'accessToken': accessToken ? accessToken: ""},
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
                this.showHomePage(isAndroidAppMode);
              }
            }
          }
        },
        (err) => {
          if (err instanceof HttpErrorResponse) {
            if (!isLocalUrl) {
              this.showHomePage(isAndroidAppMode);
            }
          }
        }
      )
    );
  }
}