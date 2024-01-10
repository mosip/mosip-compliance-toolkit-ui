import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';
import Utils from 'src/app/app.utils';
import { UserProfileService } from './user-profile.service';
import SBIHelper from 'src/app/sbi-helper';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService,
    private userProfileService: UserProfileService
  ) { }
  SBI_BASE_URL = this.appConfigService.getConfig()['SBI_BASE_URL'];
  resourceBundleJson: any = {};
  isAndroidApp = false;

  async runTestCase(
    testCase: TestCaseModel,
    sbiSelectedPort: string,
    sbiSelectedDevice: string,
    beforeKeyRotationResp: any,
    previousHash: string,
    testRunId: string,
    projectId: string
  ) {
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    try {
      const methodRequest = this.createRequest(testCase, sbiSelectedDevice, previousHash);
      //now validate the method request against the Schema
      let validationRequest: any = await SBIHelper.validateRequest(
        testCase,
        methodRequest,
        this.dataService
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
          const decodedMethodResp = SBIHelper.createDecodedResponse(
            testCase.methodName[0],
            methodResponse,
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
            validationResponse = await SBIHelper.validateResponse(
              testCase,
              methodRequest,
              decodedMethodResp,
              sbiSelectedDevice,
              startExecutionTime,
              endExecutionTime,
              beforeKeyRotationResp,
              previousHash,
              this.dataService,
              this.appConfigService,
              testRunId,
              projectId
            );
          }
          const finalResponse = {
            methodResponse: JSON.stringify(decodedMethodResp),
            methodRequest: JSON.stringify(methodRequest),
            validationResponse: validationResponse,
            methodUrl: methodUrl,
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
      } else {
        const validationResponse = {
          response: {
            validationsList: [validationRequest[appConstants.RESPONSE]],
          },
          errors: [],
        };
        const finalResponse = {
          methodResponse: this.resourceBundleJson.executeTestRun['methodNotInvoked']
            ? this.resourceBundleJson.executeTestRun['methodNotInvoked']
            : 'Method not invoked since request is invalid.',
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
        };
        //console.log('request schema validation failed');
        //console.log(finalResponse);
        return finalResponse;
      }
    } catch (error) {
      const finalResponse = {
        errors: [
          {
            errorCode: error,
            message: this.resourceBundleJson.executeTestRun['executionFailed']
              ? this.resourceBundleJson.executeTestRun['executionFailed']
              : 'Execution Failed',
          },
        ],
      };
      return finalResponse;
    }
  }

  async executeMethod(
    methodName: string,
    methodUrl: string,
    methodRequest: any
  ) {
    if (methodName == appConstants.SBI_METHOD_DISCOVER) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_DEVICE_KEY,
        methodRequest
      );
      return methodResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_DEVICE_INFO_KEY,
        methodRequest
      );
      return methodResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_CAPTURE) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_CAPTURE_KEY,
        methodRequest
      );
      return methodResponse;
    }
    else if (methodName == appConstants.SBI_METHOD_RCAPTURE) {
      let methodResponse = await this.callSBIMethod(
        methodUrl,
        appConstants.SBI_METHOD_RCAPTURE_KEY,
        methodRequest
      );
      return methodResponse;
    } else {
      return null;
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
            //console.log(response);
            //return response;
            resolve(response);
          },
          (error) => {
            resolve(false);
          }
        );
    });
  }

  createRequest(testCase: TestCaseModel, sbiSelectedDevice: string, previousHash: string): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    let request: any = {};
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DISCOVER) {
      request = {
        type: selectedSbiDevice.digitalIdDecoded.type,
      };
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_DEVICE_INFO) {
      //no params
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_CAPTURE) {
      request = SBIHelper.captureRequest(selectedSbiDevice, testCase, previousHash, this.appConfigService);
      request = {
        ...request,
        customOpts: null,
      };
    }
    if (testCase.methodName[0] == appConstants.SBI_METHOD_RCAPTURE) {
      request = SBIHelper.rcaptureRequest(selectedSbiDevice, testCase, previousHash, this.appConfigService);
      request = {
        ...request,
        customOpts: null,
      };
      request = Utils.handleInvalidRequestAttribute(testCase, request);
    }
    return request;
    //return JSON.stringify(request);
  }
}
