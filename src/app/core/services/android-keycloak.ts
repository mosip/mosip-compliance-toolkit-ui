import * as Keycloak from 'src/app/lib/keycloak';
import * as appConstants from 'src/app/app.constants';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { error } from 'console';

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
    this.androidKeycloak = Keycloak({
      clientId: environment.IAM_CLIENT_ID,
      realm: environment.IAM_REALM,
      url: environment.IAM_URL,
    });
    this.androidKeycloak.onAuthSuccess = () => {
      // save tokens to device storage
      const accessToken = this.androidKeycloak.token;
      if (accessToken) {
        localStorage.setItem(appConstants.ACCESS_TOKEN, accessToken);
        window.location.reload();
      }
    };
    this.androidKeycloak.init({
      adapter: 'capacitor-native',
      responseMode: 'query',
      enableLogging: true,
      useNonce: false,
      redirectUri: environment.redirectUri
    }).catch((error) => {
      console.log(error);
    });
  }
  getInstance() {
    return this.androidKeycloak;
  }
}