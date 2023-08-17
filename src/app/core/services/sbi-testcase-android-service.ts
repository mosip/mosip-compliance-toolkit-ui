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
  isAndroidApp = true;
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
      const decodedMethodResp = Utils.createDecodedResponse(
        testCase.methodName[0],
        executeResponse.methodResponse,
        sbiSelectedDevice,
        this.isAndroidApp
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
        validationResponse = await Utils.validateResponse(
          testCase,
          methodRequest,
          decodedMethodResp,
          sbiSelectedDevice,
          startExecutionTime,
          endExecutionTime,
          beforeKeyRotationResp,
          previousHash,
          this.dataService,
          this.appConfigService
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
}
