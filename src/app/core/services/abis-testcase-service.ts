import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { AbisProjectModel } from '../models/abis-project';

@Injectable({
  providedIn: 'root',
})
export class AbisTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) { }

  async runTestCase(
    testCase: TestCaseModel,
    abisProjectData: AbisProjectModel,
    runId: string
  ) {
    return new Promise(async (resolve, reject) => {
      let dataShareResp: any = null;
      dataShareResp = await this.getDataShareUrl(
        testCase,
        abisProjectData.bioTestDataFileName
      );
      let testDataSource: any = dataShareResp["testDataSource"];
      if (dataShareResp) {
        let methodRequest: string = this.createRequest(testCase, dataShareResp["url"], runId);
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
          //SEND THE REQUEST JSON TO ABIS QUEUE
          let methodResponse: any = await this.sendRequestToAbisQueue(
            testCase,
            abisProjectData,
            methodRequest
          );
          if (methodResponse) {
            //now validate the method response against all the validators
            // let validationResponse = await this.validateResponse(
            //   testCase,
            //   methodRequest,
            //   methodResponse,
            //   method,
            //   methodIndex
            // );
            let finalResponse = {
              methodResponse: JSON.stringify(methodResponse),
              methodRequest: JSON.stringify(methodRequest),
              validationResponse: {},
              methodUrl: abisProjectData.url,
              testDataSource: testDataSource
            };
            resolve(finalResponse);
          } else {
            resolve({
              errors: [
                {
                  errorCode: 'Connection Failure',
                  message: 'Unable to send request to ABIS queue',
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
                'Unable to generate datashare URL for testcase : ' +
                testCase.methodName,
            },
          ],
        });
      }
    });
  }

  async sendRequestToAbisQueue(testCase: TestCaseModel, abisProjectData: AbisProjectModel, methodRequest: string) {
    return new Promise((resolve, reject) => {
      let queueRequest = {
        "id": appConstants.ABIS_SEND_TO_QUEUE,
        "version": appConstants.VERSION,
        "requesttime": new Date().toISOString(),
        "metadata": {},
        "request": {
          "methodName": testCase.methodName[0],
          "requestJson": JSON.stringify(methodRequest)
        }
      };
      this.dataService.sendToQueue(queueRequest).subscribe(
        (response: any) => {
          console.log(response);
          //return response;
          if (response.errors && response.errors.length > 0) {
            resolve({
              "status": "Request not inserted in queue"
            });
          }
          const resp = response[appConstants.RESPONSE];
          console.log(resp);
          if (resp) {
            resolve({
              "status": "Request inserted in queue"
            });
          } else {
            resolve({
              "status": "Request not inserted in queue"
            });
          }
        },
        (error) => {
          console.log(error);
          resolve(false);
        }
      );
    });
  }

  getDataShareUrl(
    testCase: TestCaseModel,
    selectedBioTestDataName: string
  ): any {
    return new Promise((resolve, reject) => {
      let dataShareRequestDto = {
        testcaseId: testCase.testId,
        bioTestDataName: selectedBioTestDataName,
        purpose: testCase.otherAttributes.abisPurpose[0],
        methodName: testCase.methodName[0],
      };
      let request = {
        id: appConstants.DATASHARE_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        metadata: {},
        request: dataShareRequestDto,
      };
      this.dataService.getDataShareUrl(request).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            resolve(false);
          }
          const resp = response[appConstants.RESPONSE];
          console.log(resp);
          if (resp) {
            const dataShareResponseDto = resp['dataShareResponseDto'];
            if (dataShareResponseDto) {
              const dataShare = dataShareResponseDto['dataShare'];
              if (dataShare) {
                const url = dataShare['url'];
                if (url) {
                  resolve({
                    url: url,
                    testDataSource: resp['testDataSource']
                  });
                }
              }
            }
          }
          resolve(false);
        },
        (errors) => {
          resolve(false);
        }
      );
    });
  }

  createRequest(testCase: TestCaseModel, dataShareUrl: string, runId: string): any {
    let request: any = {};
    let urlKey = "";
    let arr = dataShareUrl.split("/");
    if (arr.length > 0) {
      urlKey = arr[arr.length-1];
      console.log(urlKey);
    }
    if (testCase.methodName[0] == appConstants.ABIS_METHOD_INSERT) {
      request = {
        "id": appConstants.ABIS_INSERT,
        "version": appConstants.ABIS_INSERT_VERSION,
        "requestId": runId + "_" + testCase.testId,
        "requesttime": new Date().toISOString(),
        "referenceId": runId + "_" + testCase.testId,
        "referenceURL": urlKey
      };
    }
    if (testCase.methodName[0] == appConstants.ABIS_METHOS_IDENTIFY) {
    }
    console.log(request);
    return request;
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
        specVersion: testCase.specVersion,
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
    methodRequest: any
  ) {
    return new Promise((resolve, reject) => {
      //console.log('validateRequest called');
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        specVersion: testCase.specVersion,
        testDescription: testCase.testDescription,
        requestSchema: testCase.requestSchema[0],
        methodRequest: JSON.stringify(methodRequest),
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
