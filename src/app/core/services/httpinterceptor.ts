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
//import jwt_decode from "jwt-decode";
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  errorMessages: any;
  decoded: any;
  constructor(
    private redirectService: LoginRedirectService,
    private router: Router,
    private appService: AppConfigService,
    private cookieService: CookieService
  ) {}
  // function which will be called for all http calls
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    request = request.clone({ withCredentials: true });
    request = request.clone({
      setHeaders: { 'X-XSRF-TOKEN': this.cookieService.get('XSRF-TOKEN') },
    });
    return next.handle(request).pipe(
      tap(
        (event) => {
          console.log("AuthInterceptor");
          if (event instanceof HttpResponse) {
            console.log("HttpResponse");
            if (event.url && event.url.split('/').includes('validateToken')) {
              console.log("url includes validateToken");
            //   if (event.body.response) {
            //     this.decoded = jwt_decode(event.body.response.token);
            //     this.headerService.setDisplayUserName(this.decoded['name']);
            //     this.headerService.setUsername(event.body.response.userId);
            //     this.headerService.setRoles(event.body.response.role);
            //     this.headerService.setUserPreferredLanguage(
            //       this.decoded['locale']
            //     );
            //   }
            //   if (
            //     event.body.errors !== null &&
            //     (event.body.errors[0]['errorCode'] ===
            //       appConstants.AUTH_ERROR_CODE[0] ||
            //       event.body.errors[0]['errorCode'] ===
            //         appConstants.AUTH_ERROR_CODE[1])
            //   ) {
            //     this.redirectService.redirect(window.location.href);
            //   }
             }
          }
        },
        (err) => {
          if (err instanceof HttpErrorResponse) {
            console.log("err");
            console.log(err.status);
            console.log(err);
            
            if (err.status === 401) {
              console.log(401);
              this.redirectService.redirect(window.location.href);
            } else if (err.status === 403) {
            } else if (err.status === 413) {
            } else if (err.status === 503) {
            } else {
            }
          }
        }
      )
    );
  }
}
