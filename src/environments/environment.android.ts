// This file can be replaced during build by using the `fileReplacements` array.
// `ng build -c=android` replaces `environment.ts` with `environment.android.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  isAndroidAppMode: 'yes',
  IAM_URL: process.env['NX_APP_IAM_URL'] || '',
  IAM_REALM: process.env['NX_APP_IAM_REALM'] || '',
  IAM_CLIENT_ID: process.env['NX_APP_IAM_CLIENT_ID'] || '',
  redirectUri: 'android://mosip-compliance-toolkit-ui',
  SERVICES_BASE_URL: process.env['NX_APP_SERVICES_BASE_URL'] || ''
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
