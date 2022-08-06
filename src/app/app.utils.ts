import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './core/components/dialog/dialog.component';
import { SbiDiscoverResponseModel } from './core/models/sbi-discover';

export default class Utils {
  static getCurrentDate() {
    let now = new Date();
    let isoDate = new Date(now).toISOString();
    return isoDate;
  }

  static getDecodedDiscoverDevice(deviceData: any) {
    try {
      console.log(deviceData);
      const digitalIdDecoded = JSON.parse(atob(deviceData.digitalId));
      const deviceDataDecoded: SbiDiscoverResponseModel = {
        ...deviceData,
        digitalIdDecoded: digitalIdDecoded,
      };
      console.log('decoded');
      console.log(deviceDataDecoded);
      return deviceDataDecoded;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedDeviceInfo(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any = Utils.parseJwt(deviceInfoResp.deviceInfo);
      //console.log('deviceInfoDecoded');
      //console.log(deviceInfoDecoded);
      const digitalIdDecoded = Utils.parseJwt(deviceInfoDecoded.digitalId);
      //console.log('digitalIdDecoded');
      //console.log(digitalIdDecoded);
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error:deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
      console.log('deviceInfoDecodedFull');
      console.log(deviceInfoDecodedFull);
      return deviceInfoDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static parseJwt(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  static showSuccessMessage(message: string, dialog: MatDialog) {
    const title = 'Success';
    const body = {
      case: 'SUCCESS',
      title: title,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }

  static showErrorMessage(
    errorsList: any,
    dialog: MatDialog,
    customMsg?: string
  ) {
    const titleOnError = 'Error';
    let message = '';
    if (errorsList && errorsList.length > 0) {
      let error = errorsList[0];
      message = error.errorCode
        ? error.errorCode + ' - ' + error.message
        : error.message;
    }
    if (customMsg) {
      message = customMsg;
    }
    if (message == '') {
      message = 'Unexpected error occured.';
    }
    const body = {
      case: 'ERROR',
      title: titleOnError,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }
}
