import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { CookieService } from 'ngx-cookie-service';
import { AppConfigService } from 'src/app/app-config.service';

@Injectable()
export class LoginRedirectService {
  constructor(
    private cookie: CookieService,
    private appService: AppConfigService
  ) {}

  redirect(url: string) {
    console.log(url);
    const stateParam = uuid();
    this.cookie.set('state', stateParam, undefined, '/');
    console.log('returning false login redirect' + stateParam);
    let url1 = `${this.appService.getConfig().SERVICES_BASE_URL}${
      this.appService.getConfig().login
    }` +
    btoa(url) +
    '?state=' +
    stateParam;
    //console.log(url1); 
    window.location.href = url1;
  }
}
