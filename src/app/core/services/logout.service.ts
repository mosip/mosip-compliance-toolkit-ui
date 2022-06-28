import { LoginRedirectService } from './loginredirect.service';
import { Router } from '@angular/router';
import { ResponseModel } from './../models/response.model';
import { LogoutResponse } from './../models/logoutresponse';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HttpClient,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { AppConfigService } from 'src/app/app-config.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService,
    private redirectService: LoginRedirectService,
    private appService: AppConfigService
  ) {}

  logout() {
    let adminUrl = this.appService.getConfig().toolkitUiUrl;
    window.location.href = `${this.appService.getConfig().SERVICES_BASE_URL}${this.appService.getConfig().logout}?redirecturi=`+btoa(window.location.href);
/*
    this.http
      .get(
        `${this.appService.getConfig().SERVICES_BASE_URL}${
          this.appService.getConfig().logout
        }?redirecturi=`+btoa(window.location.href),
        {
          observe: 'response',
          responseType: "json",
        }
      )
      .subscribe(
        (res: any) => {
          console.log(res.body.response);
          this.cookieService.deleteAll();
          if (res && res.body && res.body.response) {
            if (res.body.response.status === 'Success') {
              sessionStorage.clear();
              localStorage.clear();
              this.cookieService.deleteAll();
              this.redirectService.redirect(window.location.origin + adminUrl);
            } else {
              window.alert(res.body.response.message);
            }
          } else {
            window.alert('Unable to process logout request');
          }
        },
        (error: HttpErrorResponse) => {
          window.alert(error.message);
        }
      );*/
  }
}
