import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';
import Utils from 'src/app/app.utils';
import { CapacitorIntent } from 'capacitor-intent';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseAndroidService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) { }

  async runTestCase(
    testCase: TestCaseModel,
    sbiSelectedPort: string,
    sbiSelectedDevice: string,
    beforeKeyRotationResp: any
  ) {
    return new Promise(async (resolve, reject) => {
      const methodRequest = this.createRequest(testCase, sbiSelectedDevice);
      let startExecutionTime = new Date().toISOString();
      let methodResponse: any = await this.executeMethod(
        testCase.methodName[0],
        methodRequest
      );
      let endExecutionTime = new Date().toISOString();
      if (methodResponse) {
        const decodedMethodResp = this.createDecodedResponse(
          testCase,
          methodResponse,
          sbiSelectedDevice
        );
        let performValidations = true;
        if (
          testCase.otherAttributes.keyRotationTestCase &&
          !beforeKeyRotationResp
        ) {
          performValidations = false;
        }
        if (
          testCase.otherAttributes.keyRotationTestCase &&
          beforeKeyRotationResp
        ) {
          performValidations = true;
        }
        //now validate the method response against all the validators
        let validationResponse: any = {};
        if (performValidations) {
          validationResponse = await this.validateResponse(
            testCase,
            methodRequest,
            decodedMethodResp,
            sbiSelectedDevice,
            startExecutionTime,
            endExecutionTime,
            beforeKeyRotationResp
          );
        }
        let finalResponse = {
          methodResponse: JSON.stringify(decodedMethodResp),
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
          methodUrl: '',
          testDataSource: '',
        };
        resolve(finalResponse);
      } else {
        resolve({
          errors: [
            {
              errorCode: 'Connection Failure',
              message: 'Unable to connect to device / SBI',
            },
          ],
        });
      }
    });
  }

  async executeMethod(
    methodName: string,
    methodRequest: string
  ) {
    if (methodName == appConstants.SBI_METHOD_DEVICE) {
      let methodResponse = await this.callSBIMethodAndroid(appConstants.SBI_METHOD_DEVICE);
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
    }
    if (methodName == appConstants.SBI_METHOD_CAPTURE) {
    }
    if (methodName == appConstants.SBI_METHOD_RCAPTURE) {
    }
  }

  async callSBIMethodAndroid(testcaseMethodName: string) {
    console.log("in callSBIMethodAndroid method");
    const DISCOVERY_INTENT_ACTION = 'io.sbi.device';
    const D_INFO_INTENT_ACTION = '.Info';
    const R_CAPTURE_INTENT_ACTION = '.rCapture';
    const SBI_INTENT_REQUEST_KEY = 'input';
    const SBI_INTENT_RESPONSE_KEY = 'response';
    const RESULT_OK = 'success';
    const MODALITY = 'Face';
    const SBI_DISCOVER = "SBI_DISCOVER";
    const SBI_INFO = "SBI_INFO";
    const SBI_R_CAPTURE = "SBI_R_CAPTURE";

    console.log("calling mock sbi");
    return new Promise((resolve, reject) => {
      CapacitorIntent.startActivity({
        methodType: SBI_DISCOVER,
        action: DISCOVERY_INTENT_ACTION,
        extraKey: SBI_INTENT_REQUEST_KEY,
        extraValue: MODALITY
      }).then((result: any) => {
        console.log("result recvd");
        console.log(result);
        const status = result["status"];
        if (status == RESULT_OK) {
          const resp = result["response"];
          let discoverResp = JSON.parse(resp);
          let callbackId = discoverResp["callbackId"];
          resolve(discoverResp);
          /*
          CapacitorIntent.startActivity({
            methodType: SBI_INFO,
            action: callbackId + D_INFO_INTENT_ACTION
          }).then((result: any) => {
            console.log("result recvd");
            console.log(result);
            resolve(true);
          });*/
        }

      })
        .catch(async (err) => {
          console.log("error recvd");
          console.error(err);

          resolve(false);
        })
    });
  }


  createRequest(testCase: TestCaseModel, sbiSelectedDevice: string): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    let request = {};
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE) {
      request = {
        type: selectedSbiDevice.digitalIdDecoded.type,
      };
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE_INFO) {
      //no params
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE) {
      request = {
        env: appConstants.DEVELOPER,
        purpose: selectedSbiDevice.purpose,
        specVersion: selectedSbiDevice.specVersion[0],
        timeout: testCase.otherAttributes.timeout
          ? testCase.otherAttributes.timeout.toString()
          : this.appConfigService.getConfig()['sbiTimeout']
            ? this.appConfigService.getConfig()['sbiTimeout'].toString()
            : '10000',
        captureTime: new Date().toISOString(),
        transactionId: testCase.testId + '-' + new Date().getUTCMilliseconds(),
        domainUri: '', //TODO
        bio: [
          {
            type: selectedSbiDevice.digitalIdDecoded.type,
            count: testCase.otherAttributes.bioCount,
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: selectedSbiDevice.deviceId,
            deviceSubId: testCase.otherAttributes.deviceSubId,
            previousHash: '',
            bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
          },
        ],
        customOpts: null,
      };
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE) {
      request = {
        env: appConstants.DEVELOPER,
        purpose: selectedSbiDevice.purpose,
        specVersion: selectedSbiDevice.specVersion[0],
        timeout: this.getTimeout(testCase),
        captureTime: new Date().toISOString(),
        transactionId: testCase.testId + '-' + new Date().getUTCMilliseconds(),
        bio: [
          {
            type: selectedSbiDevice.digitalIdDecoded.type,
            count: testCase.otherAttributes.bioCount,
            exception: this.getBioSubType(testCase.otherAttributes.exceptions),
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: selectedSbiDevice.deviceId,
            deviceSubId: testCase.otherAttributes.deviceSubId,
            previousHash: '',
            bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
          },
        ],
        customOpts: null,
      };
    }
    //console.log(JSON.stringify(request));
    return request;
    //return JSON.stringify(request);
  }

  getTimeout(testCase: TestCaseModel) {
    return testCase.otherAttributes.timeout
      ? testCase.otherAttributes.timeout.toString()
      : this.appConfigService.getConfig()['sbiTimeout']
        ? this.appConfigService.getConfig()['sbiTimeout'].toString()
        : '10000';
  }
  getBioSubType(segments: Array<string>): Array<string> {
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

  createDecodedResponse(
    testCase: TestCaseModel,
    methodResponse: any,
    sbiSelectedDevice: string
  ): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE) {
      let decodedDataArr: SbiDiscoverResponseModel[] = [];
      const decodedData = Utils.getDecodedDiscoverDevice(methodResponse);
        if (decodedData != null) {
          decodedDataArr.push(decodedData);
        }
      return decodedDataArr;
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE_INFO) {
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
      testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE ||
      testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE
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

  async validateResponse(
    testCase: TestCaseModel,
    methodRequest: any,
    methodResponse: any,
    sbiSelectedDevice: string,
    startExecutionTime: string,
    endExecutionTime: string,
    beforeKeyRotationResp: any
  ) {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    return new Promise((resolve, reject) => {
      //console.log('validateResponse called');
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
          timeout: this.getTimeout(testCase),
          beforeKeyRotationResp: beforeKeyRotationResp
            ? beforeKeyRotationResp
            : null,
          modality: testCase.otherAttributes.biometricTypes[0],
        }),
        validatorDefs: testCase.validatorDefs[0],
      };
      let request = {
        id: appConstants.VALIDATIONS_ADD_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        request: validateRequest,
      };
      this.dataService.validateResponse(request).subscribe(
        (response) => {
          resolve(response);
        },
        (errors) => {
          resolve(errors);
        }
      );
    });
  }

  async validateRequest(testCase: TestCaseModel, methodRequest: any) {
    return new Promise((resolve, reject) => {
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
      this.dataService.validateRequest(request).subscribe(
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
