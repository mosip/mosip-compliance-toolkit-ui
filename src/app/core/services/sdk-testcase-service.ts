import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';

@Injectable({
  providedIn: 'root',
})
export class SdkTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}

  async runTestCase(
    testCase: TestCaseModel,
    sdkUrl: string,
    selectedBioTestDataName: string
  ) {
    return new Promise(async (resolve, reject) => {
      let isCombinationTestCase = testCase.methodName.length > 1 ? true : false;
      const methodsArr = testCase.methodName;
      let methodIndex = 0;
      let firstResponse: any = null;
      //only 2 methods are allowed in a testcase
      for (const method of methodsArr) {
        console.log('EXECUTING METHOD: ' + method);
        if (methodIndex == 0) {
          firstResponse = await this.runTestCaseMethod(
            testCase,
            sdkUrl,
            selectedBioTestDataName,
            method,
            methodIndex,
            null
          );
          console.log('done: ' + method);
          if (!isCombinationTestCase) {
            resolve(firstResponse);
          }
          methodIndex++;
        } else {
          if (
            firstResponse &&
            !firstResponse.errors &&
            firstResponse.methodResponse
          ) {
            let firstMethodResponse = JSON.parse(firstResponse.methodResponse);
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
              resolve(secondMethodResponse);
            } else {
              resolve({
                errors: [
                  {
                    errorCode: 'Failure',
                    message:
                      'Unable to generate request to SDK service: ' + method,
                  },
                ],
              });
            }
          } else {
            resolve(firstResponse);
          }
        }
      }
    });
  }

  async runTestCaseMethod(
    testCase: TestCaseModel,
    sdkUrl: string,
    selectedBioTestDataName: string,
    method: string,
    methodIndex: number,
    firstMethodResponse: any
  ) {
    return new Promise(async (resolve, reject) => {
      let methodRequest: any = null;
      if (firstMethodResponse) {
        methodRequest = await this.generateRequestForSDKFrmBirs(
          method,
          testCase,
          selectedBioTestDataName,
          firstMethodResponse
        );
      } else {
        methodRequest = await this.generateRequestForSDK(
          method,
          testCase,
          selectedBioTestDataName
        );
      }
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
          let methodResponse: any = await this.executeMethod(
            method,
            sdkUrl,
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
            };
            resolve(finalResponse);
          } else {
            resolve({
              errors: [
                {
                  errorCode: 'Connection Failure',
                  message: 'Unable to connect to SDK services',
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
          resolve(finalResponse);
        }
      } else {
        resolve({
          errors: [
            {
              errorCode: 'Failure',
              message:
                'Unable to generate request to SDK service: ' +
                testCase.methodName,
            },
          ],
        });
      }
    });
  }

  async executeMethod(methodName: string, sdkUrl: string, methodRequest: any) {
    return new Promise((resolve, reject) => {
      if (sdkUrl.lastIndexOf('/') !== sdkUrl.length - 1) {
        sdkUrl += '/';
      }
      const url = sdkUrl + methodName;
      this.dataService.callSDKMethod(url, methodRequest).subscribe(
        (response) => {
          console.log(response);
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
    return new Promise((resolve, reject) => {
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
      this.dataService.generateRequestForSDK(request).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            resolve(false);
          }
          resolve(response[appConstants.RESPONSE]);
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
    console.log(firstMethodResponse);
    let sdkRequestDto = {
      methodName: method,
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
    console.log(request);
    return new Promise((resolve, reject) => {
      this.dataService.generateRequestForSDKFrmBirs(request).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            resolve(false);
          }
          resolve(response[appConstants.RESPONSE]);
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
    return new Promise((resolve, reject) => {
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
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
    return new Promise((resolve, reject) => {
      //console.log('validateRequest called');
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
        requestSchema: testCase.requestSchema[methodIndex],
        methodRequest: methodRequest,
      };
      //console.log(validateRequest);
      let request = {
        id: appConstants.VALIDATIONS_ADD_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        request: validateRequest,
      };
      this.dataService.validateRequest(request).subscribe(
        (response) => {
          //console.log(response);
          resolve(response);
        },
        (errors) => {
          resolve(errors);
        }
      );
    });
  }
}
