import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  appConfig: any;

  constructor(private http: HttpClient) {}

  async loadAppConfig() {
    //console.log('loadAppConfig');
    this.appConfig = await this.http.get('./assets/config.json').toPromise();
    //console.log(this.appConfig.SERVICES_BASE_URL + "configs");
    this.http.get(this.appConfig.SERVICES_BASE_URL + "configs").subscribe(
      (response: any) => {
      //console.log(response);
      this.appConfig = {...this.appConfig, ...response["response"]};
      //console.log(this.appConfig);
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getConfig() {
    return this.appConfig;
  }
}
