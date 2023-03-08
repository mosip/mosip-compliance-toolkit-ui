import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';
import Utils from 'src/app/app.utils';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}
  SBI_BASE_URL = this.appConfigService.getConfig()['SBI_BASE_URL'];

  async runTestCase(
    testCase: TestCaseModel,
    sbiSelectedPort: string,
    sbiSelectedDevice: string,
    beforeKeyRotationResp: any
  ) {
    return new Promise(async (resolve, reject) => {
      const methodRequest = this.createRequest(testCase, sbiSelectedDevice);
      //now validate the method request against the Schema
      let validationRequest: any = await this.validateRequest(
        testCase,
        methodRequest
      );
      if (
        validationRequest &&
        validationRequest[appConstants.RESPONSE] &&
        validationRequest[appConstants.RESPONSE].status == appConstants.SUCCESS
      ) {
        let startExecutionTime = new Date().toISOString();
        const methodUrl = this.getMethodUrl(sbiSelectedPort, testCase);
        let methodResponse: any = await this.executeMethod(
          testCase.methodName[0],
          methodUrl,
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
            methodUrl: methodUrl,
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
      } else {
        let validationResponse = {
          response: {
            validationsList: [validationRequest[appConstants.RESPONSE]],
          },
          errors: [],
        };
        let finalResponse = {
          methodResponse: 'Method not invoked since request is invalid.',
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
        };
        console.log('request schema validation failed');
        console.log(finalResponse);
        resolve(finalResponse);
      }
    });
  }

  async executeMethod(
    methodName: string,
    methodUrl: string,
    methodRequest: any
  ) {
    if (methodName == appConstants.SBI_METHOD_DEVICE) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_DEVICE_KEY,
        methodRequest
      );
      //console.log(methodResponse);
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_DEVICE_INFO_KEY,
        methodRequest
      );
      //console.log(methodResponse);
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_CAPTURE) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_CAPTURE_KEY,
        methodRequest
      );
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_RCAPTURE) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_RCAPTURE_KEY,
        methodRequest
      );
      return methodResponse;
    }
  }

  getMethodUrl(sbiSelectedPort: string, testCase: TestCaseModel) {
    let methodUrl =
      this.SBI_BASE_URL + ':' + sbiSelectedPort + '/' + testCase.methodName[0];
    if (testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE) {
      methodUrl =
        this.SBI_BASE_URL +
        ':' +
        sbiSelectedPort +
        '/' +
        appConstants.SBI_METHOD_CAPTURE;
    }
    return methodUrl;
  }

  callSBIMethod(methodUrl: string, methodType: string, requestBody: any) {
    return new Promise((resolve, reject) => {
      this.dataService
        .callSBIMethod(methodUrl, methodType, requestBody)
        .subscribe(
          (response) => {
            console.log(response);
            //return response;
            resolve(response);
          },
          (error) => {
            resolve(false);
          }
        );
    });
  }

  createRequest(testCase: TestCaseModel, sbiSelectedDevice: string): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    let request: any = {};
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
        transactionId: this.getTransactionId(testCase),
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
        transactionId: this.getTransactionId(testCase),
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
      if (testCase.otherAttributes.invalidRequestAttribute) {
        let newRequest: any = {};
        let invalidKey = testCase.otherAttributes.invalidRequestAttribute;
        if (
          invalidKey.includes('[') &&
          invalidKey.includes(']') &&
          invalidKey.includes('.')
        ) {
          newRequest = request;
          let splitArr = invalidKey.split('[');
          if (splitArr.length > 0) {
            let firstPart = splitArr[0];
            let nestedObj = request[firstPart][0];
            let secondSplitArr = invalidKey.split('.');
            let newNestedRequest = changeKeyName(nestedObj, secondSplitArr[1]);
            newRequest[firstPart] = [newNestedRequest];
          }
        } else if (invalidKey.includes('.')) {
          newRequest = request;
          let splitArr = invalidKey.split('.');
          if (splitArr.length > 0) {
            let nestedObj = request[splitArr[0]];
            let newNestedRequest = changeKeyName(nestedObj, splitArr[1]);
            newRequest[splitArr[0]] = newNestedRequest;
          }
        } else {
          newRequest = changeKeyName(request, invalidKey);
        }

        function changeKeyName(request: any, invalidKeyName: any) {
          let newRequest: any = {};
          var keys = Object.keys(request);
          for (const key of keys) {
            const keyName = key.toString();
            console.log(keyName);
            if (invalidKeyName === keyName) {
              const invalidKeyName = keyName + 'XXX';
              newRequest[invalidKeyName] = request[keyName];
            } else {
              const val = request[keyName];
              newRequest[keyName] = val;
            }
          }
          return newRequest;
        }
        request = newRequest;
      }
    }
    //console.log(JSON.stringify(request));
    return request;
    //return JSON.stringify(request);
  }
  getTransactionId(testCase: TestCaseModel) {
    //console.log("getTransactionId" +testCase.otherAttributes.transactionId);
    return testCase.otherAttributes.transactionId
      ? testCase.otherAttributes.transactionId.toString()
      : testCase.testId + '-' + new Date().getUTCMilliseconds();
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
      methodResponse.forEach((deviceData: any) => {
        const decodedData = Utils.getDecodedDiscoverDevice(deviceData);
        if (decodedData != null) {
          decodedDataArr.push(decodedData);
        }
      });
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
