import { Injectable } from '@angular/core';
import { AppConfigService } from 'src/app/app-config.service';
import { AndroidKeycloakService } from './android-keycloak';
import { environment } from 'src/environments/environment';
import * as appConstants from 'src/app/app.constants';
import { CapacitorCookies } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  constructor(
    private androidKeycloakService: AndroidKeycloakService,
    private appService: AppConfigService
  ) { }

  async logout(): Promise<any> {
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      await this.androidKeycloakService.getInstance().logout();
      this.androidKeycloakService.getInstance().clearToken();
      await CapacitorCookies.deleteCookie({
        url: encodeURI(environment.SERVICES_BASE_URL),
        key: appConstants.AUTHORIZATION
      });
      return true;
    } else {
      window.location.href = `${this.appService.getConfig().SERVICES_BASE_URL}${this.appService.getConfig().logout}?redirecturi=` + btoa(window.location.href);
      localStorage.removeItem('config');
    }
    //let adminUrl = this.appService.getConfig().toolkitUiUrl;
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
