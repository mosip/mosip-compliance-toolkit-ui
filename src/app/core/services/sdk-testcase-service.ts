import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import Utils from 'src/app/app.utils';

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
        let methodResponse = await this.executeMethod(
          testCase.methodName,
          sdkUrl,
          methodRequest
        );
        const decodedMethodResp = this.createDecodedResponse(
          testCase,
          methodResponse
        );
        //now validate the method response against all the validators
        let validationResponse = await this.validateResponse(
          testCase,
          methodRequest,
          decodedMethodResp
        );
        let finalResponse = {
          methodResponse: JSON.stringify(decodedMethodResp),
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
        };
        resolve(finalResponse);
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

  async executeMethod(methodName: string, sdkUrl: string, methodRequest: any) {
    return new Promise((resolve, reject) => {
      const url = sdkUrl + methodName;
      this.dataService.callSDKMethod(url, methodRequest).subscribe(
        (response) => {
          console.log(response);
          //return response;
          resolve(response);
        },
        (error) => {}
      );
    });
  }

  generateRequestForSDK(testCase: TestCaseModel): any {
    return new Promise((resolve, reject) => {
      //console.log('validateRequest called');
      this.dataService
        .generateRequestForSDK(
          testCase.methodName,
          testCase.testId,
          testCase.otherAttributes.modalities
        )
        .subscribe(
          (response: any) => {
            if (response.errors && response.errors.length > 0) {
              resolve(response.errors);
            }
            //console.log(response);
            resolve(response[appConstants.RESPONSE]);
          },
          (errors) => {
            resolve(errors);
          }
        );
    });
  }

  createDecodedResponse(testCase: TestCaseModel, methodResponse: any): any {
    return methodResponse;
  }

  async validateResponse(
    testCase: TestCaseModel,
    methodRequest: any,
    methodResponse: any
  ) {
    return new Promise((resolve, reject) => {
      //console.log('validateResponse called');
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
        responseSchema: testCase.responseSchema,
        methodResponse: JSON.stringify(methodResponse),
        methodRequest: JSON.stringify(methodRequest),
        methodName: testCase.methodName,
        validatorDefs: testCase.validatorDefs,
      };
      //console.log(validateRequest);
      let request = {
        id: appConstants.VALIDATIONS_ADD_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        request: validateRequest,
      };
      this.dataService.validateResponse(request).subscribe(
        (response) => {
          //console.log(response);
          resolve(response);
          //this.testCaseResults = JSON.stringify(response);
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
