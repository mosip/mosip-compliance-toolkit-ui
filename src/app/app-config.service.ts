import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  appConfig: any;

  constructor(private http: HttpClient) { }

  async loadAppConfig() {
    //console.log('loadAppConfig');
    this.appConfig = await this.http.get('./assets/config.json').toPromise();
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      this.appConfig["SERVICES_BASE_URL"] = environment.SERVICES_BASE_URL;
      console.log("updated SERVICES_BASE_URL: " + this.appConfig["SERVICES_BASE_URL"]);
    }
    //console.log(this.appConfig.SERVICES_BASE_URL + "configs");
    this.http.get(this.appConfig.SERVICES_BASE_URL + "configs").subscribe(
      (response: any) => {
        //console.log(response);
        this.appConfig = { ...this.appConfig, ...response["response"] };
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
