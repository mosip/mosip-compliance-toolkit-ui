import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './core/components/dialog/dialog.component';
import { SbiDiscoverResponseModel } from './core/models/sbi-discover';

export default class Utils {
  static getCurrentDate() {
    let now = new Date();
    let isoDate = new Date(now).toISOString();
    return isoDate;
  }

  static chkDeviceTypeSubType(
    decodedData: any,
    selectedSbiDevice: SbiDiscoverResponseModel
  ): boolean {
    if (
      decodedData != null &&
      decodedData['deviceInfoDecoded'] &&
      decodedData['deviceInfoDecoded']['digitalIdDecoded'] &&
      decodedData['deviceInfoDecoded']['digitalIdDecoded']['type'] ==
        selectedSbiDevice.digitalIdDecoded.type &&
      decodedData['deviceInfoDecoded']['digitalIdDecoded']['deviceSubType'] ==
        selectedSbiDevice.digitalIdDecoded.deviceSubType
    ) {
      return true;
    } else {
      return false;
    }
  }
  static getDecodedDiscoverDevice(deviceData: any) {
    try {
      //console.log(deviceData);
      const digitalIdDecoded = JSON.parse(atob(deviceData.digitalId));
      const deviceDataDecoded: SbiDiscoverResponseModel = {
        ...deviceData,
        digitalIdDecoded: digitalIdDecoded,
      };
      //console.log('decoded');
      //console.log(deviceDataDecoded);
      return deviceDataDecoded;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedDeviceInfo(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any;
      if (deviceInfoResp.deviceInfo) {
        deviceInfoDecoded = Utils.parseJwt(deviceInfoResp.deviceInfo);
      }
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = Utils.parseJwt(deviceInfoDecoded.digitalId);
      }
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error: deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
      //console.log('deviceInfoDecodedFull');
      //console.log(deviceInfoDecodedFull);
      return deviceInfoDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedUnregistetedDeviceInfo(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any;
      if (deviceInfoResp.deviceInfo) {
        deviceInfoDecoded = JSON.parse(atob(deviceInfoResp.deviceInfo));
      }  
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = JSON.parse(deviceInfoDecoded.digitalId);
      } 
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error: deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
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
