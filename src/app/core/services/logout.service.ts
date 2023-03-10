
import { Injectable } from '@angular/core';
import { AppConfigService } from 'src/app/app-config.service';
import { AndroidKeycloakService } from './android-keycloak';
import { environment } from 'src/environments/environment';
import * as appConstants from 'src/app/app.constants';
import { CookieService } from 'ngx-cookie-service';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class LogoutService {
  constructor(
    private androidKeycloakService: AndroidKeycloakService,
    private appService: AppConfigService,
    private cookieService: CookieService,
  ) { }

  async logout() {
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      return new Promise(async (resolve, reject) => {
        await this.androidKeycloakService.getInstance().logout();
        this.androidKeycloakService.getInstance().clearToken();
        await Preferences.remove({ key: appConstants.ACCESS_TOKEN });
        resolve(true);
      });
    } else {
      window.location.href = `${this.appService.getConfig().SERVICES_BASE_URL}${this.appService.getConfig().logout}?redirecturi=` + btoa(window.location.href);
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
