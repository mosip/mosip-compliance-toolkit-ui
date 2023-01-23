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
  ) {}
  // function which will be called for all http calls
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
     let isLocalUrl = false;
    // if (this.appConfigService.getConfig()) {
    //   const sbiUrl = this.appConfigService.getConfig()['SBI_BASE_URL'];
    //   const sdkUrl = localStorage.getItem(appConstants.SDK_PROJECT_URL);
    //   if (request.url.includes(sbiUrl)) {
    //     isLocalUrl = true;
    //   }
    //   if (sdkUrl && request.url.includes(sdkUrl)) {
    //     isLocalUrl = true;
    //   }
    // }
    const harcodedToken = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJubEpTaUExM2tPUWhZQ0JxMEVKSkRlWnFTOGsybDB3MExUbmQ1WFBCZ20wIn0.eyJleHAiOjE2NzQ0ODIzMzcsImlhdCI6MTY3NDQ0NjMzOCwiYXV0aF90aW1lIjoxNjc0NDQ2MzM3LCJqdGkiOiIzOTczMDk2YS1lNmMwLTQyYTYtYTNiYi1jM2IzN2QxYzVkNDQiLCJpc3MiOiJodHRwczovL2lhbS5kZXYubW9zaXAubmV0L2F1dGgvcmVhbG1zL21vc2lwIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImMwMzE1MjM5LTg3ZDMtNDE4ZS05N2Q1LWJjN2E2OWY1Yjk5YSIsInR5cCI6IkJlYXJlciIsImF6cCI6Im1vc2lwLXRvb2xraXQtY2xpZW50Iiwic2Vzc2lvbl9zdGF0ZSI6ImU1MzIyZDRhLTBlOWYtNDZhYi05ZDBiLTRjMmM5ZDIxYTljNSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJQQVJUTkVSX0FETUlOIiwidW1hX2F1dGhvcml6YXRpb24iLCJHTE9CQUxfQURNSU4iLCJkZWZhdWx0LXJvbGVzLW1vc2lwIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwic2lkIjoiZTUzMjJkNGEtMGU5Zi00NmFiLTlkMGItNGMyYzlkMjFhOWM1IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiTWF5dXJhIERlc2htdWtoIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWF5dXJhZCIsImdpdmVuX25hbWUiOiJNYXl1cmEiLCJsb2NhbGUiOiJlbmciLCJmYW1pbHlfbmFtZSI6IkRlc2htdWtoIiwiZW1haWwiOiJtYXl1cmEuZGVzaG11a2hAZ21haWwuY29tIn0.ULWJx4ZpqTphtMb-WOA6K6BhrVVOspB5cH9fDSE_ydGN4WHNlyROJnfZkIsGqy7rZtp4I-FL6-2OIFgOMWMGbXdnw4Fp2exFE-HfwJQ1BjBpj6SbiYjWqq4a0Qfhm_fxg8m0ItCG7RDcn2rJDAgcC_UDe6JvbVFrzJ8PF0DsqAYGTSv666feAnv0wj5oV7I75q1RvqqBVhnvELd8y1JLYXdEFRMynosnx_0kJmWpMV8j7wh9R7gC3IwdhWoMR6a__mqbOINokQo_RIqXb2NLS0efTBSKoALxsU6FJaN4KBdglq3QXv8z2rmka0cQXKZgOihNlDp7KAtZIQTXiTUM1A";
    if (!isLocalUrl) {
      request = request.clone({
        setHeaders: {
          'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN'),
          'Authorization': 'Authorization=' + harcodedToken
        }
      });
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
                const token = harcodedToken;
                this.decoded = jwt_decode(token);
                //this.decoded = jwt_decode(event.body.response.token);
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
                //this.showHomePage();
                const token = harcodedToken;
                this.decoded = jwt_decode(token);
                //this.decoded = jwt_decode(event.body.response.token);
                this.userProfileService.setDisplayUserName(
                  this.decoded['name']
                );
                this.userProfileService.setUsername(event.body.response.userId);
                this.userProfileService.setRoles(event.body.response.role);
                this.userProfileService.setUserPreferredLanguage(
                  this.decoded['locale']
                );
              }
            }
          }
        },
        (err) => {
          if (err instanceof HttpErrorResponse) {
            if (!isLocalUrl) {
              //this.showHomePage();
              const token = harcodedToken;
              this.decoded = jwt_decode(token);
              this.userProfileService.setDisplayUserName(this.decoded['name']);
              this.userProfileService.setUsername('Mayura');
              this.userProfileService.setRoles('Individual');
              this.userProfileService.setUserPreferredLanguage(
                this.decoded['locale']
              );
            }
            this.router.navigate([`toolkit/dashboard`]);
            //TODO alert ERROR
          }
        }
      )
    );
  }
}