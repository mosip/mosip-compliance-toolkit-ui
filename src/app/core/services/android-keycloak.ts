import * as Keycloak from 'src/app/lib/keycloak';
import * as appConstants from 'src/app/app.constants';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class AndroidKeycloakService {

  private androidKeycloak: Keycloak.KeycloakInstance;
  constructor(
  ) {
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      this.setUp();
    }
  }

  public setUp() {
    console.log("creating androidKeycloak instance");
    this.androidKeycloak = Keycloak({
      clientId: environment.IAM_CLIENT_ID,
      realm: environment.IAM_REALM,
      url: environment.IAM_URL,
    });
    this.androidKeycloak.onAuthSuccess = async () => {
      // save tokens to device storage
      console.log('onAuthSuccess');
      const accessToken = this.androidKeycloak.token;
      console.log(accessToken);
      if (accessToken) {
        await Preferences.set({
          key: appConstants.ACCESS_TOKEN,
          value: accessToken,
        });
        window.location.reload();
      }
    };
    this.androidKeycloak.init({
      adapter: 'capacitor-native',
      responseMode: 'query',
      enableLogging: true,
      useNonce: false,
      redirectUri: environment.redirectUri
    });
  }
  getInstance() {
    return this.androidKeycloak;
  }
}