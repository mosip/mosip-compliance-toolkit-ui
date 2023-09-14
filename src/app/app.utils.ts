import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './core/components/dialog/dialog.component';
import { SbiDiscoverResponseModel } from './core/models/sbi-discover';
import { UserProfileService } from './core/services/user-profile.service';
import { DataService } from './core/services/data-service';

export default class Utils {
  static getCurrentDate() {
    let now = new Date();
    let isoDate = new Date(now).toISOString();
    return isoDate;
  }

  static chkDeviceTypeSubTypeForDeviceInfo(
    deviceInfoDecoded: any,
    selectedSbiDevice: SbiDiscoverResponseModel
  ): boolean {
    if (
      deviceInfoDecoded != null &&
      deviceInfoDecoded['deviceInfoDecoded'] &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded'] &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded']['type'] ==
        selectedSbiDevice.digitalIdDecoded.type &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded'][
        'deviceSubType'
      ] == selectedSbiDevice.digitalIdDecoded.deviceSubType
    ) {
      return true;
    } else {
      return false;
    }
  }

  static chkDeviceTypeSubTypeForData(
    decodedData: any,
    selectedSbiDevice: SbiDiscoverResponseModel
  ): boolean {
    if (
      decodedData != null &&
      decodedData['dataDecoded'] &&
      decodedData['dataDecoded']['digitalIdDecoded'] &&
      decodedData['dataDecoded']['digitalIdDecoded']['type'] ==
        selectedSbiDevice.digitalIdDecoded.type &&
      decodedData['dataDecoded']['digitalIdDecoded']['deviceSubType'] ==
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
        deviceInfoDecoded = Utils.parsePayload(deviceInfoResp.deviceInfo);
      }
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = Utils.parsePayload(deviceInfoDecoded.digitalId);
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
        digitalIdDecoded = JSON.parse(atob(deviceInfoDecoded.digitalId));
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

  static getDecodedDataInfo(dataResp: any) {
    try {
      let dataDecoded: any;
      if (dataResp.data) {
        dataDecoded = Utils.parsePayload(dataResp.data);
      }
      let digitalIdDecoded: any;
      if (dataDecoded && dataDecoded.digitalId) {
        digitalIdDecoded = Utils.parsePayload(dataDecoded.digitalId);
      }
      dataDecoded = {
        ...dataDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const dataDecodedFull = {
        error: dataResp.error,
        hash: dataResp.hash,
        sessionKey: dataResp.sessionKey,
        specVersion: dataResp.specVersion,
        thumbprint: dataResp.thumbprint,
        data: dataResp.data,
        dataDecoded: dataDecoded,
      };
      return dataDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedUnregistetedData(deviceInfoResp: any) {
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

  static parsePayload(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  static showSuccessMessage(resourceBundle: any, titleKey: string, messageKey: string, dialog: MatDialog) {
    let title: any;
    let message: any;
    if (resourceBundle && resourceBundle[titleKey] && resourceBundle[messageKey]) {
      title = resourceBundle[titleKey];
      message = resourceBundle[messageKey];
    } else {
      title = titleKey;
      message = messageKey;
    }
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
    resourceBundle: any,
    errorsList: any,
    dialog: MatDialog,
    customMsg?: string,
    showErrCode?: boolean
  ) {
    const titleOnError = resourceBundle.serviceErrors['error']? resourceBundle.serviceErrors['error'] : 'Error';
    let message = '';
    if (errorsList && errorsList.length > 0) {
      let error = errorsList[0];
      //check if translation is available
      const translatedMsg = resourceBundle.serviceErrors[error.errorCode];
      if (!showErrCode) {
        if (translatedMsg) {
          message = translatedMsg;
        } else {
          message = error.message;
        }
      } else {
        if (translatedMsg) {
          message = error.errorCode
            ? error.errorCode + ' - ' + translatedMsg
            : translatedMsg;
        } else {
          message = error.errorCode
            ? error.errorCode + ' - ' + error.message
            : error.message;
        }
      }
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

  static translateTestcase(
    testcase: any,
    resourceBundle: any
  ) {
    if (resourceBundle && resourceBundle.testcases != null && resourceBundle.testcases[testcase.testId] != null) {
      testcase.testName = resourceBundle.testcases[testcase.testId]['testName'];
      testcase.testDescription = resourceBundle.testcases[testcase.testId]['testDescription'];
      for ( const validators of testcase.validatorDefs) {
        for ( const validator of validators) {
          validator.description = resourceBundle.validators[validator.name] 
          ? resourceBundle.validators[validator.name]
          : validator.description;
        } 
      }
    }
    return testcase;
  }
}
