import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { UserProfileService } from './user-profile.service';
import Utils from 'src/app/app.utils';

@Injectable({
  providedIn: 'root',
})
export class SdkTestCaseService {
  resourceBundleJson: any = {};
  constructor(
    private dataService: DataService,
    private userProfileService: UserProfileService
  ) { }

  async runTestCase(
    testCase: TestCaseModel,
    sdkUrl: string,
    selectedBioTestDataName: string,
    methodIndex: number,
    firstMethodRespForSDK: any
  ): Promise<any> {
    this.resourceBundleJson = await Utils.getResourceBundle(this.userProfileService.getUserPreferredLanguage(), this.dataService);
    let isCombinationTestCase = testCase.methodName.length > 1 ? true : false;
    const method = testCase.methodName[methodIndex];
    //console.log('EXECUTING METHOD: ' + method);
    if (methodIndex == 0) {
      const firstResponse = await this.runTestCaseMethod(
        testCase,
        sdkUrl,
        selectedBioTestDataName,
        method,
        methodIndex,
        null
      );
      //console.log('done: ' + method);
      return firstResponse;
    } else {
      if (
        firstMethodRespForSDK &&
        !firstMethodRespForSDK.errors &&
        firstMethodRespForSDK.methodResponse
      ) {
        let firstMethodResponse = JSON.parse(firstMethodRespForSDK.methodResponse);
        if (
          firstMethodResponse &&
          firstMethodResponse.response &&
          firstMethodResponse.response.response &&
          firstMethodResponse.response.response.segments
        ) {
          let secondMethodResponse = await this.runTestCaseMethod(
            testCase,
            sdkUrl,
            selectedBioTestDataName,
            method,
            methodIndex,
            firstMethodResponse.response.response.segments
          );
          return secondMethodResponse;
        }
      }
      const errResponse = {
        errors: [
          {
            errorCode: this.resourceBundleJson.executeTestRun['failure']
              ? this.resourceBundleJson.executeTestRun['failure']
              : 'Failure',
            message: this.resourceBundleJson.executeTestRun['unableToGenerateRequest']
              ? this.resourceBundleJson.executeTestRun['unableToGenerateRequest'] + method
              : 'Unable to generate request to SDK service: ' + method,
          },
        ],
      }
      return errResponse;
    }
  }

  async runTestCaseMethod(
    testCase: TestCaseModel,
    sdkUrl: string,
    selectedBioTestDataName: string,
    method: string,
    methodIndex: number,
    firstMethodResponse: any
  ) {
    let methodRequestResp: any = null;
    if (firstMethodResponse) {
      methodRequestResp = await this.generateRequestForSDKFrmBirs(
        method,
        testCase,
        selectedBioTestDataName,
        firstMethodResponse
      );
    } else {
      methodRequestResp = await this.generateRequestForSDK(
        method,
        testCase,
        selectedBioTestDataName
      );
    }
    let methodRequest: any = methodRequestResp["generatedRequest"];
    let testDataSource: any = methodRequestResp["testDataSource"];
    if (methodRequest) {
      //now validate the method request against the Schema
      let validationRequest: any = await this.validateRequest(
        testCase,
        methodRequest,
        methodIndex
      );
      if (
        validationRequest &&
        validationRequest[appConstants.RESPONSE] &&
        validationRequest[appConstants.RESPONSE].status ==
        appConstants.SUCCESS
      ) {
        if (sdkUrl.lastIndexOf('/') !== sdkUrl.length - 1) {
          sdkUrl += '/';
        }
        const url = sdkUrl + method;
        let methodResponse: any = await this.executeMethod(
          url,
          methodRequest
        );
        if (methodResponse) {
          //now validate the method response against all the validators
          let validationResponse = await this.validateResponse(
            testCase,
            methodRequest,
            methodResponse,
            method,
            methodIndex
          );
          let finalResponse = {
            methodResponse: JSON.stringify(methodResponse),
            methodRequest: methodRequest,
            validationResponse: validationResponse,
            methodUrl: url,
            methodId: testCase.methodName[methodIndex],
            testDataSource: testDataSource
          };
          return finalResponse;
        } else {
          const finalResponse = {
            errors: [
              {
                errorCode: this.resourceBundleJson.executeTestRun['connectionFailure']
                  ? this.resourceBundleJson.executeTestRun['connectionFailure']
                  : 'Connection Failure',
                message: this.resourceBundleJson.executeTestRun['unableToConnectSDK']
                  ? this.resourceBundleJson.executeTestRun['unableToConnectSDK']
                  : 'Unable to connect to SDK services',
              },
            ],
          };
          return finalResponse;
        }
      } else {
        let validationResponse = {
          response: {
            validationsList: [validationRequest[appConstants.RESPONSE]],
          },
          errors: [],
        };
        let finalResponse = {
          methodResponse: this.resourceBundleJson.executeTestRun['methodNotInvoked']
            ? this.resourceBundleJson.executeTestRun['methodNotInvoked']
            : 'Method not invoked since request is invalid.',
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
        };
        return finalResponse;
      }
    } else {
      const finalResponse = {
        errors: [
          {
            errorCode: this.resourceBundleJson.executeTestRun['failure']
              ? this.resourceBundleJson.executeTestRun['failure']
              : 'Failure',
            message: this.resourceBundleJson.executeTestRun['unableToGenerateRequest']
              ? this.resourceBundleJson.executeTestRun['unableToGenerateRequest'] + testCase.methodName
              : 'Unable to generate request to SDK service: ' + testCase.methodName,
          },
        ],
      };
      return finalResponse;
    }
  }

  async executeMethod(sdkUrl: string, methodRequest: any) {
    return new Promise((resolve, reject) => {
      this.dataService.callSDKMethod(sdkUrl, methodRequest).subscribe(
        (response) => {
          //console.log(response);
          //return response;
          resolve(response);
        },
        (error) => {
          console.log(error);
          resolve(false);
        }
      );
    });
  }

  generateRequestForSDK(
    methodName: string,
    testCase: TestCaseModel,
    selectedBioTestDataName: string
  ): any {
    let sdkRequestDto = {
      methodName: methodName,
      testcaseId: testCase.testId,
      modalities: testCase.otherAttributes.modalities,
      bioTestDataName: selectedBioTestDataName,
      convertSourceFormat: testCase.otherAttributes.convertSourceFormat
        ? testCase.otherAttributes.convertSourceFormat.toString()
        : '',
      convertTargetFormat: testCase.otherAttributes.convertTargetFormat
        ? testCase.otherAttributes.convertTargetFormat.toString()
        : '',
    };
    let request = {
      id: appConstants.GENERATE_SDK_REQUEST_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: sdkRequestDto,
    };
    return new Promise((resolve, reject) => {
      this.dataService.generateRequestForSDK(request).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            resolve(false);
          }
          const resp = response[appConstants.RESPONSE];
          if (resp) {
            resolve(resp);
          }
        },
        (errors) => {
          resolve(false);
        }
      );
    });
  }

  generateRequestForSDKFrmBirs(
    method: string,
    testCase: TestCaseModel,
    selectedBioTestDataName: string,
    firstMethodResponse: any
  ): any {
    //console.log(firstMethodResponse);
    let sdkRequestDto = {
      methodName: testCase.methodName.join(','),
      testcaseId: testCase.testId,
      modalities: testCase.otherAttributes.modalities,
      bioTestDataName: selectedBioTestDataName,
      birsForProbe: btoa(JSON.stringify(firstMethodResponse)),
    };
    let request = {
      id: appConstants.GENERATE_SDK_REQUEST_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: sdkRequestDto,
    };
    //console.log(request);
    return new Promise((resolve, reject) => {
      this.dataService.generateRequestForSDKFrmBirs(request).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            resolve(false);
          }
          const resp = response[appConstants.RESPONSE];
          if (resp) {
            resolve(resp);
          }
          else {
            resolve(false);
          }
        },
        (errors) => {
          resolve(false);
        }
      );
    });
  }

  async validateResponse(
    testCase: TestCaseModel,
    methodRequest: any,
    methodResponse: any,
    method: string,
    methodIndex: number
  ) {
    let validateRequest = {
      testCaseType: testCase.testCaseType,
      testName: testCase.testName,
      specVersion: testCase.specVersion,
      testId: testCase.testId,
      responseSchema: testCase.responseSchema[methodIndex],
      isNegativeTestcase: testCase.isNegativeTestcase
        ? testCase.isNegativeTestcase
        : false,
      methodResponse: JSON.stringify(methodResponse),
      methodRequest: methodRequest,
      methodName: method,
      validatorDefs: testCase.validatorDefs[methodIndex],
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

  async validateRequest(
    testCase: TestCaseModel,
    methodRequest: any,
    methodIndex: number
  ) {
    let validateRequest = {
      testCaseType: testCase.testCaseType,
      testName: testCase.testName,
      specVersion: testCase.specVersion,
      testId: testCase.testId,
      requestSchema: testCase.requestSchema[methodIndex],
      methodRequest: methodRequest,
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
