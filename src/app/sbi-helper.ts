import { AppConfigService } from './app-config.service';
import Utils from './app.utils';
import { SbiDiscoverResponseModel } from './core/models/sbi-discover';
import { TestCaseModel } from './core/models/testcase';
import * as appConstants from 'src/app/app.constants';
import { DataService } from './core/services/data-service';

export default class SBIHelper {
  static captureRequest(
    selectedSbiDevice: SbiDiscoverResponseModel,
    testCase: TestCaseModel,
    previousHash: string,
    appConfigService: AppConfigService
  ) {
    let request = {
      env: appConstants.DEVELOPER,
      purpose: selectedSbiDevice.purpose,
      specVersion: selectedSbiDevice.specVersion[0],
      timeout: this.getTimeout(testCase, appConfigService),
      captureTime: new Date().toISOString(),
      transactionId: this.getTransactionId(testCase),
      domainUri: '', //TODO
      bio: [
        {
          type: selectedSbiDevice.digitalIdDecoded.type,
          count: testCase.otherAttributes.bioCount,
          requestedScore: testCase.otherAttributes.requestedScore,
          deviceId: selectedSbiDevice.deviceId,
          deviceSubId: testCase.otherAttributes.deviceSubId,
          previousHash: previousHash,
          bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
        },
      ],
    };
    return request;
  }

  static rcaptureRequest(
    selectedSbiDevice: SbiDiscoverResponseModel,
    testCase: TestCaseModel,
    previousHash: string,
    appConfigService: AppConfigService
  ) {
    let request = {
      env: appConstants.DEVELOPER,
      purpose: selectedSbiDevice.purpose,
      specVersion: selectedSbiDevice.specVersion[0],
      timeout: this.getTimeout(testCase, appConfigService),
      captureTime: new Date().toISOString(),
      transactionId: this.getTransactionId(testCase),
      bio: [
        {
          type: selectedSbiDevice.digitalIdDecoded.type,
          count: testCase.otherAttributes.bioCount,
          exception: this.getBioSubType(testCase.otherAttributes.exceptions),
          requestedScore: testCase.otherAttributes.requestedScore,
          deviceId: selectedSbiDevice.deviceId,
          deviceSubId: testCase.otherAttributes.deviceSubId,
          previousHash: previousHash,
          bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
        },
      ],
    };
    return request;
  }

  static getTransactionId(testCase: TestCaseModel) {
    return testCase.otherAttributes.transactionId
      ? testCase.otherAttributes.transactionId.toString()
      : testCase.testId + '-' + new Date().getUTCMilliseconds();
  }

  static getTimeout(
    testCase: TestCaseModel,
    appConfigService: AppConfigService
  ) {
    return testCase.otherAttributes.timeout
      ? testCase.otherAttributes.timeout.toString()
      : appConfigService.getConfig()['sbiTimeout']
      ? appConfigService.getConfig()['sbiTimeout'].toString()
      : '10000';
  }

  static getBioSubType(segments: Array<string>): Array<string> {
    let bioSubTypes = new Array<string>();
    segments.forEach((segment) => {
      let mappedVal = '';
      switch (segment) {
        case 'Left':
          mappedVal = 'Left';
          break;
        case 'Right':
          mappedVal = 'Right';
          break;
        case 'RightIndex':
          mappedVal = 'Right IndexFinger';
          break;
        case 'RightMiddle':
          mappedVal = 'Right MiddleFinger';
          break;
        case 'RightRing':
          mappedVal = 'Right RingFinger';
          break;
        case 'RightLittle':
          mappedVal = 'Right LittleFinger';
          break;
        case 'RightThumb':
          mappedVal = 'Right Thumb';
          break;
        case 'LeftIndex':
          mappedVal = 'Left IndexFinger';
          break;
        case 'LeftMiddle':
          mappedVal = 'Left MiddleFinger';
          break;
        case 'LeftRing':
          mappedVal = 'Left RingFinger';
          break;
        case 'LeftLittle':
          mappedVal = 'Left LittleFinger';
          break;
        case 'LeftThumb':
          mappedVal = 'Left Thumb';
          break;
        case 'Face':
          mappedVal = 'null';
          break;
        case 'UNKNOWN':
          mappedVal = 'UNKNOWN';
          break;
      }
      bioSubTypes.push(mappedVal);
    });
    return bioSubTypes;
  }

  static createDecodedResponse(
    testCaseMethodName: string,
    methodResponse: any,
    sbiSelectedDevice: string,
    isAndroidApp: boolean
  ): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    if (testCaseMethodName == appConstants.SBI_METHOD_DISCOVER) {
      if (isAndroidApp) {
        let decodedDataArr: SbiDiscoverResponseModel[] = [];
        const decodedData = Utils.getDecodedDiscoverDevice(methodResponse);
        if (decodedData != null) {
          decodedDataArr.push(decodedData);
        }
        return decodedDataArr;
      } else {
        let decodedDataArr: SbiDiscoverResponseModel[] = [];
        methodResponse.forEach((deviceData: any) => {
          const decodedData = Utils.getDecodedDiscoverDevice(deviceData);
          if (decodedData != null) {
            decodedDataArr.push(decodedData);
          }
        });
        return decodedDataArr;
      }
    }
    if (testCaseMethodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let decodedDataArr: any[] = [];
      methodResponse.forEach((deviceInfoResp: any) => {
        if (deviceInfoResp && !deviceInfoResp.deviceInfo) {
          decodedDataArr.push(deviceInfoResp);
        } else if (deviceInfoResp && deviceInfoResp.deviceInfo == '') {
          decodedDataArr.push(deviceInfoResp);
        } else {
          //chk if device is registered
          let arr = deviceInfoResp.deviceInfo.split('.');
          if (arr.length >= 3) {
            //this is registered device
            const decodedData: any = Utils.getDecodedDeviceInfo(deviceInfoResp);
            if (
              Utils.chkDeviceTypeSubTypeForDeviceInfo(
                decodedData,
                selectedSbiDevice
              )
            ) {
              decodedDataArr.push(decodedData);
            }
          } else {
            //this is unregistered device
            const decodedData: any =
              Utils.getDecodedUnregistetedDeviceInfo(deviceInfoResp);
            if (
              Utils.chkDeviceTypeSubTypeForDeviceInfo(
                decodedData,
                selectedSbiDevice
              )
            ) {
              decodedDataArr.push(decodedData);
            }
          }
        }
      });
      return decodedDataArr;
    }
    if (
      testCaseMethodName == appConstants.SBI_METHOD_CAPTURE ||
      testCaseMethodName == appConstants.SBI_METHOD_RCAPTURE
    ) {
      let decodedDataArr: any[] = [];
      methodResponse.biometrics.forEach((dataResp: any) => {
        if (dataResp && dataResp.data == '') {
          decodedDataArr.push(dataResp);
        } else {
          //chk if device is registered
          let arr = dataResp.data.split('.');
          if (arr.length >= 3) {
            //this is registered device
            const decodedData: any = Utils.getDecodedDataInfo(dataResp);
            if (
              Utils.chkDeviceTypeSubTypeForData(decodedData, selectedSbiDevice)
            ) {
              decodedDataArr.push(decodedData);
            }
          } else {
            //this is unregistered device
            const decodedData: any = Utils.getDecodedUnregistetedData(dataResp);
            if (
              Utils.chkDeviceTypeSubTypeForData(decodedData, selectedSbiDevice)
            ) {
              decodedDataArr.push(decodedData);
            }
          }
        }
      });
      return {
        biometrics: decodedDataArr,
      };
    }
    return methodResponse;
    //return JSON.stringify(request);
  }

  static validateResponse(
    testCase: TestCaseModel,
    methodRequest: any,
    methodResponse: any,
    sbiSelectedDevice: string,
    startExecutionTime: string,
    endExecutionTime: string,
    beforeKeyRotationResp: any,
    previousHash: string,
    dataService: DataService,
    appConfigService: AppConfigService
  ) {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    console.log(`previousHash ${previousHash}`);
    let validateRequest = {
      testCaseType: testCase.testCaseType,
      testName: testCase.testName,
      specVersion: testCase.specVersion,
      testDescription: testCase.testDescription,
      responseSchema: testCase.responseSchema[0],
      isNegativeTestcase: testCase.isNegativeTestcase
        ? testCase.isNegativeTestcase
        : false,
      methodResponse: JSON.stringify(methodResponse),
      methodRequest: JSON.stringify(methodRequest),
      methodName: testCase.methodName[0],
      extraInfoJson: JSON.stringify({
        certificationType: selectedSbiDevice.certification,
        startExecutionTime: startExecutionTime,
        endExecutionTime: endExecutionTime,
        timeout: this.getTimeout(testCase, appConfigService),
        beforeKeyRotationResp: beforeKeyRotationResp
          ? beforeKeyRotationResp
          : null,
        modality: testCase.otherAttributes.biometricTypes[0],
        previousHash: previousHash,
      }),
      validatorDefs: testCase.validatorDefs[0],
    };
    let request = {
      id: appConstants.VALIDATIONS_ADD_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: validateRequest,
    };
    return new Promise((resolve, reject) => {
      dataService.validateResponse(request).subscribe(
        (response) => {
          resolve(response);
        },
        (errors) => {
          resolve(errors);
        }
      );
    });
  }

  static validateRequest(
    testCase: TestCaseModel,
    methodRequest: any,
    dataService: DataService
  ) {
    let validateRequest = {
      testCaseType: testCase.testCaseType,
      testName: testCase.testName,
      specVersion: testCase.specVersion,
      testDescription: testCase.testDescription,
      requestSchema: testCase.requestSchema[0],
      methodRequest: JSON.stringify(methodRequest),
    };
    let request = {
      id: appConstants.VALIDATIONS_ADD_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: validateRequest,
    };
    return new Promise((resolve, reject) => {
      dataService.validateRequest(request).subscribe(
        (response) => {
          resolve(response);
        },
        (errors) => {
          resolve(errors);
        }
      );
    });
  }
}
