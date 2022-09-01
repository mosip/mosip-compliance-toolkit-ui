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

  async runTestCase(testCase: TestCaseModel, sdkUrl: string) {
    return new Promise(async (resolve, reject) => {
      const methodRequest: any = await this.generateRequestForSDK(testCase);
      if (methodRequest) {
        //now validate the method request against the Schema
        let validationRequest: any = await this.validateRequest(
          testCase,
          methodRequest
        );
        if (
          validationRequest &&
          validationRequest[appConstants.RESPONSE] &&
          validationRequest[appConstants.RESPONSE].status ==
            appConstants.SUCCESS
        ) {
          let methodResponse: any = await this.executeMethod(
            testCase.methodName,
            sdkUrl,
            methodRequest
          );
          if (methodResponse) {
            //now validate the method response against all the validators
            let validationResponse = await this.validateResponse(
              testCase,
              methodRequest,
              methodResponse
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
      if (sdkUrl.lastIndexOf('/') !== (sdkUrl.length - 1)) {
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

  generateRequestForSDK(testCase: TestCaseModel): any {
    return new Promise((resolve, reject) => {
      this.dataService
        .generateRequestForSDK(
          testCase.methodName,
          testCase.testId,
          testCase.otherAttributes.modalities.toString()
        )
        .subscribe(
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
    methodResponse: any
  ) {
    return new Promise((resolve, reject) => {
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
        responseSchema: testCase.responseSchema,
        isNegativeTestcase: testCase.isNegativeTestcase ? testCase.isNegativeTestcase : false,
        methodResponse: JSON.stringify(methodResponse),
        methodRequest: methodRequest,
        methodName: testCase.methodName,
        validatorDefs: testCase.validatorDefs,
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
      //console.log('validateRequest called');
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
        requestSchema: testCase.requestSchema,
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
