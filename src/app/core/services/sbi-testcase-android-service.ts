import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';
import Utils from 'src/app/app.utils';
import { MosipSbiCapacitorPlugin } from 'mosip-sbi-capacitor-plugin';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseAndroidService {
  resourceBundleJson: any = {};
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService,
    private userProfileService: UserProfileService
  ) { }

  async runTestCase(
    testCase: TestCaseModel,
    sbiDeviceType: string,
    callbackId: string,
    sbiSelectedDevice: string,
    beforeKeyRotationResp: any,
    previousHash: string
  ) {
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    const methodRequest = this.createRequest(testCase, sbiSelectedDevice, previousHash);
    let startExecutionTime = new Date().toISOString();
    let executeResponse: any = await this.executeMethod(
      testCase,
      sbiDeviceType,
      callbackId,
      JSON.stringify(methodRequest)
    );
    console.log('executeResponse');
    console.log(executeResponse);
    let endExecutionTime = new Date().toISOString();
    if (executeResponse) {
      const decodedMethodResp = this.createDecodedResponse(
        testCase.methodName[0],
        executeResponse.methodResponse,
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
          beforeKeyRotationResp,
          previousHash
        );
      }
      const finalResponse = {
        methodResponse: JSON.stringify(decodedMethodResp),
        methodRequest: JSON.stringify(methodRequest),
        validationResponse: validationResponse,
        methodUrl: executeResponse.methodUrl,
        testDataSource: '',
      };
      return finalResponse;
    } else {
      const finalResponse = {
        errors: [
          {
            errorCode: this.resourceBundleJson.executeTestRun['connectionFailure']
              ? this.resourceBundleJson.executeTestRun['connectionFailure']
              : 'Connection Failure',
            message: this.resourceBundleJson.executeTestRun['unableToConnectSBI']
              ? this.resourceBundleJson.executeTestRun['unableToConnectSBI']
              : 'Unable to connect to device / SBI',
          },
        ],
      };
      return finalResponse;
    }
  }

  async executeMethod(
    testCase: TestCaseModel,
    sbiDeviceType: string,
    callbackId: string,
    methodRequestStr: string
  ) {
    const methodName = testCase.methodName[0];

    if (methodName == appConstants.SBI_METHOD_DISCOVER) {
      let executeResponse = await this.callSBIMethodAndroid(appConstants.SBI_METHOD_DISCOVER, sbiDeviceType, callbackId, methodRequestStr);
      return executeResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let executeResponse = await this.callSBIMethodAndroid(appConstants.SBI_METHOD_DEVICE_INFO, sbiDeviceType, callbackId, methodRequestStr);
      return executeResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_CAPTURE) {
      let executeResponse = await this.callSBIMethodAndroid(appConstants.SBI_METHOD_CAPTURE, sbiDeviceType, callbackId, methodRequestStr);
      return executeResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_RCAPTURE) {
      let executeResponse = await this.callSBIMethodAndroid(appConstants.SBI_METHOD_RCAPTURE, sbiDeviceType, callbackId, methodRequestStr);
      return executeResponse;
    }
    else {
      return null;
    }
  }

  async callSBIMethodAndroid(testcaseMethodName: string, sbiDeviceType: string, callbackId: string, methodRequestStr: string) {
    console.log("in callSBIMethodAndroid method");
    return new Promise((resolve, reject) => {
      MosipSbiCapacitorPlugin.startActivity({
        methodType: appConstants.SBI_METHOD_DISCOVER,
        action: appConstants.DISCOVERY_INTENT_ACTION,
        requestKey: appConstants.SBI_INTENT_REQUEST_KEY,
        requestValue: sbiDeviceType
      }).then((discoverResult: any) => {
        console.log("discover result recvd");
        console.log(discoverResult);
        const discoverStatus = discoverResult[appConstants.STATUS];
        if (discoverStatus == appConstants.RESULT_OK) {
          const discoverResp = JSON.parse(discoverResult[appConstants.RESPONSE]);
          if (testcaseMethodName == appConstants.SBI_METHOD_DISCOVER) {
            resolve({
              methodResponse: discoverResp,
              methodUrl: appConstants.DISCOVERY_INTENT_ACTION
            });
          }
          if (testcaseMethodName == appConstants.SBI_METHOD_DEVICE_INFO) {
            MosipSbiCapacitorPlugin.startActivity({
              methodType: appConstants.SBI_METHOD_DEVICE_INFO,
              action: callbackId + appConstants.D_INFO_INTENT_ACTION
            }).then((deviceInfoResult: any) => {
              console.log("device info result recvd");
              const deviceInfoStatus = deviceInfoResult[appConstants.STATUS];
              if (deviceInfoStatus == appConstants.RESULT_OK) {
                const deviceInfoResp = JSON.parse(deviceInfoResult[appConstants.RESPONSE]);
                resolve({
                  methodResponse: deviceInfoResp,
                  methodUrl: callbackId + appConstants.D_INFO_INTENT_ACTION
                });
              } else {
                resolve(false);
              }
            }).catch((error) => { reject(error) });
          }
          if (testcaseMethodName == appConstants.SBI_METHOD_RCAPTURE) {
            MosipSbiCapacitorPlugin.startActivity({
              methodType: appConstants.SBI_METHOD_RCAPTURE,
              action: callbackId + appConstants.R_CAPTURE_INTENT_ACTION,
              requestKey: appConstants.SBI_INTENT_REQUEST_KEY,
              requestValue: methodRequestStr
            }).then((rCaptureResult: any) => {
              console.log("r capture result recvd");
              const rCaptureStatus = rCaptureResult[appConstants.STATUS];
              if (rCaptureStatus == appConstants.RESULT_OK) {
                const rCaptureResp = JSON.parse(rCaptureResult[appConstants.RESPONSE]);
                resolve({
                  methodResponse: rCaptureResp,
                  methodUrl: callbackId + appConstants.R_CAPTURE_INTENT_ACTION
                });
              } else {
                resolve(false);
              }
            }).catch((error) => { reject(error) });
          }
          if (testcaseMethodName == appConstants.SBI_METHOD_CAPTURE) {
            MosipSbiCapacitorPlugin.startActivity({
              methodType: appConstants.SBI_METHOD_CAPTURE,
              action: callbackId + appConstants.CAPTURE_INTENT_ACTION,
              requestKey: appConstants.SBI_INTENT_REQUEST_KEY,
              requestValue: methodRequestStr
            }).then((captureResult: any) => {
              console.log("capture result recvd");
              const captureStatus = captureResult[appConstants.STATUS];
              if (captureStatus == appConstants.RESULT_OK) {
                const captureResp = JSON.parse(captureResult[appConstants.RESPONSE]);
                resolve({
                  methodResponse: captureResp,
                  methodUrl: callbackId + appConstants.CAPTURE_INTENT_ACTION
                });
              } else {
                resolve(false);
              }
            }).catch((error) => { reject(error) });
          }
        } else {
          resolve(false);
        }
      })
        .catch(async (err) => {
          resolve(false);
        })
    });
  }


  createRequest(testCase: TestCaseModel, sbiSelectedDevice: string, 
    previousHash: string): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    let request: any = {};
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DISCOVER) {
      //will be taken from "sbiDeviceType"
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE_INFO) {
      //no params
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE) {
      request = Utils.captureRequest(selectedSbiDevice, testCase, previousHash, this.appConfigService);
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE) {
      request = Utils.rcaptureRequest(selectedSbiDevice, testCase, previousHash, this.appConfigService);
      request = Utils.handleInvalidRequestAttribute(testCase, request);
    }
    return request;
  }

  createDecodedResponse(
    testcaseMethodName: string,
    methodResponse: any,
    sbiSelectedDevice: string
  ): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    if (testcaseMethodName == appConstants.SBI_METHOD_DISCOVER) {
      let decodedDataArr: SbiDiscoverResponseModel[] = [];
      const decodedData = Utils.getDecodedDiscoverDevice(methodResponse);
      if (decodedData != null) {
        decodedDataArr.push(decodedData);
      }
      return decodedDataArr;
    }
    if (testcaseMethodName == appConstants.SBI_METHOD_DEVICE_INFO) {
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
      testcaseMethodName == appConstants.SBI_METHOD_CAPTURE ||
      testcaseMethodName == appConstants.SBI_METHOD_RCAPTURE
    ) {
      let decodedDataArr: any[] = [];
      methodResponse.biometrics.forEach((bioResp: any) => {
        if (bioResp && bioResp.data == '') {
          decodedDataArr.push(bioResp);
        } else {
          //chk if device is registered
          let arr = bioResp.data.split('.');
          if (arr.length >= 3) {
            //this is registered device
            const decodedData: any = Utils.getDecodedDataInfo(bioResp);
            if (
              Utils.chkDeviceTypeSubTypeForData(decodedData, selectedSbiDevice)
            ) {
              decodedDataArr.push(decodedData);
            }
          } else {
            //this is unregistered device
            const decodedData: any = Utils.getDecodedUnregistetedData(bioResp);
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
    beforeKeyRotationResp: any,
    previousHash: string
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
        timeout: Utils.getTimeout(testCase, this.appConfigService),
        beforeKeyRotationResp: beforeKeyRotationResp
          ? beforeKeyRotationResp
          : null,
        modality: testCase.otherAttributes.biometricTypes[0],
        previousHash: previousHash
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
