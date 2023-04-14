import { Injectable } from '@angular/core';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { AbisProjectModel } from '../models/abis-project';
import { ActiveMqService } from './activemq-service';
import { RxStompService } from './rx-stomp.service';

@Injectable({
  providedIn: 'root',
})
export class AbisTestCaseService {
  rxStompService: RxStompService;
  constructor(
    private dataService: DataService,
    private activeMqService: ActiveMqService
  ) { }

  async sendRequestToQueue(
    testCase: TestCaseModel,
    abisProjectData: AbisProjectModel,
    runId: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!this.rxStompService) {
        this.rxStompService = this.activeMqService.setUpConfig(abisProjectData);
      }
      let dataShareResp: any = null;
      dataShareResp = await this.getDataShareUrl(
        testCase,
        abisProjectData.bioTestDataFileName
      );
      if (dataShareResp) {
        let methodRequest: any = this.createRequest(testCase, dataShareResp["url"], runId);
        methodRequest = JSON.stringify(methodRequest);
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
          console.log("request validation done");
          //SEND THE REQUEST JSON TO ABIS QUEUE
          console.log(methodRequest);
          let sendRequestResp: any = await this.activeMqService.sendToQueue(this.rxStompService, abisProjectData, methodRequest);
          resolve({
            ...sendRequestResp,
            methodRequest: methodRequest,
            testDataSource: dataShareResp.testDataSource
          });
        } else {
          let validationResponse = {
            response: {
              validationsList: [validationRequest[appConstants.RESPONSE]],
            },
            errors: [],
          };
          let finalResponse = {
            methodResponse: 'Method not invoked since request is invalid.',
            methodRequest: methodRequest,
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

  async fetchResponseFromQueue(
    testCase: TestCaseModel,
    abisProjectData: AbisProjectModel,
    methodRequest: any,
    testDataSource: string
  ) {
    return new Promise(async (resolve, reject) => {
      if (!this.rxStompService) {
        this.rxStompService = this.activeMqService.setUpConfig(abisProjectData);
      }
      //FETCH THE RESPONSE JSON TO ABIS QUEUE
      let methodResponse: any = await this.activeMqService.readFromQueue(this.rxStompService, abisProjectData, methodRequest);
      console.log("waiting");
      if (methodResponse) {
        // now validate the method response against all the validators
        let validationResponse = await this.validateResponse(
          testCase,
          methodRequest,
          methodResponse,
          testCase.methodName[0],
          0
        );
        let finalResponse = {
          methodResponse: methodResponse,
          methodRequest: methodRequest,
          validationResponse: validationResponse,
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
    if (testCase.methodName[0] == appConstants.ABIS_METHOD_INSERT) {
      request = {
        "id": appConstants.ABIS_INSERT,
        "version": appConstants.ABIS_INSERT_VERSION,
        "requestId": runId + "_" + testCase.testId,
        "requesttime": new Date().toISOString(),
        "referenceId": runId + "_" + testCase.testId,
        "referenceURL": dataShareUrl
      };
    }
    if (testCase.methodName[0] == appConstants.ABIS_METHOS_IDENTIFY) {
    }
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
        methodResponse: methodResponse,
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
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        specVersion: testCase.specVersion,
        testDescription: testCase.testDescription,
        requestSchema: testCase.requestSchema[0],
        methodRequest: methodRequest,
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
