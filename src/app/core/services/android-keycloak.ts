import * as Keycloak from 'src/app/lib/keycloak';
import * as appConstants from 'src/app/app.constants';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AndroidKeycloakService {

  private androidKeycloak: Keycloak.KeycloakInstance;

  constructor(
  ) { this.setUp(); }

  public setUp() {
    console.log("creating androidKeycloak instance");
    this.androidKeycloak = Keycloak({
      clientId: environment.IAM_CLIENT_ID,
      realm: environment.IAM_REALM,
      url: environment.IAM_URL,
    });
    this.androidKeycloak.onAuthSuccess = () => {
      // save tokens to device storage
      console.log('saving accessToken in localStorage');
      const accessToken = this.androidKeycloak.token;
      console.log(accessToken);
      if (accessToken) {
        localStorage.removeItem(appConstants.ACCESS_TOKEN);
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
    });
  }
  getInstance() {
    return this.androidKeycloak;
  }
}