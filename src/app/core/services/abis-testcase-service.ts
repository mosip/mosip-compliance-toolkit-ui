import { Injectable } from '@angular/core';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { AbisProjectModel } from '../models/abis-project';
import { ActiveMqService } from './activemq-service';
import { RxStompService } from './rx-stomp.service';
import Utils from 'src/app/app.utils';

@Injectable({
  providedIn: 'root',
})
export class AbisTestCaseService {

  constructor(
    private dataService: DataService,
    private activeMqService: ActiveMqService
  ) { }

  async sendRequestToQueue(
    rxStompService: RxStompService,
    testCase: TestCaseModel,
    abisProjectData: AbisProjectModel,
    methodName: string,
    methodIndex: number,
    requestId: string,
    referenceId: string,
    galleryIds: any[],
    cbeffFileSuffix: number
  ) {
    
    let dataShareResp: any = null;
    //create a datashare URL but only for Insert
    if (methodName == appConstants.ABIS_METHOD_INSERT) {
      dataShareResp = await this.createDataShareUrl(
        testCase,
        abisProjectData.bioTestDataFileName,
        cbeffFileSuffix
      );
      if (!dataShareResp) {
        const finalResponse = {
          errors: [
            {
              errorCode: 'Failure',
              message:
                'Unable to generate datashare URL for testcase : ' +
                testCase.testId,
            },
          ],
        };
        return finalResponse;
      }
    }
    let methodRequest: any = this.createRequest(testCase, methodName, dataShareResp, requestId, referenceId, galleryIds);    
    //handle expireDataShareUrl testcase
    let invalidKey = testCase.otherAttributes.invalidRequestAttribute;
    if (invalidKey == 'expireDataShareUrl') {
      await this.expireDataShareUrl(dataShareResp);
    }
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
      //SEND THE REQUEST JSON TO ABIS QUEUE
      // console.log(methodRequest);
      let sendRequestResp: any = await this.activeMqService.sendToQueue(rxStompService, abisProjectData, methodRequest);
      const finalResponse = {
        ...sendRequestResp,
        methodRequest: methodRequest,
        testDataSource: dataShareResp ? dataShareResp.testDataSource : ''
      };
      return finalResponse;
    } else {
      const validationResponse = {
        response: {
          validationsList: [validationRequest[appConstants.RESPONSE]],
        },
        errors: [],
      };
      const finalResponse = {
        methodResponse: 'Method not invoked since request is invalid.',
        methodRequest: methodRequest,
        validationResponse: validationResponse,
      };
      return finalResponse;
    }
    
  }

  async runValidators(
    testCase: TestCaseModel,
    abisProjectData: AbisProjectModel,
    methodName: string,
    methodRequest: string,
    methodResponse: string,
    testDataSource: string,
    methodIndex: number
  ) {
    return new Promise<any>(async (resolve, reject) => {
      // now validate the method response against all the validators
      let validationResponse = await this.validateResponse(
        testCase,
        methodRequest,
        methodResponse,
        methodName,
        methodIndex
      );
      let finalResponse = {
        methodResponse: methodResponse,
        methodRequest: methodRequest,
        validationResponse: validationResponse,
        methodUrl: abisProjectData.url,
        testDataSource: testDataSource
      };
      resolve(finalResponse);
    })
  }

  createDataShareUrl(
    testCase: TestCaseModel,
    selectedBioTestDataName: string,
    cbeffFileIndex: number
  ): any {
    return new Promise((resolve, reject) => {
      let dataShareRequestDto = {
        testcaseId: testCase.testId,
        bioTestDataName: selectedBioTestDataName,
        cbeffFileSuffix: cbeffFileIndex
      };
      let request = {
        id: appConstants.DATASHARE_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        metadata: {},
        request: dataShareRequestDto,
      };
      this.dataService.createDataShareUrl(request).subscribe(
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
                    testDataSource: resp['testDataSource'],
                    transactionsAllowed: dataShare['transactionsAllowed']
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

  createRequest(testCase: TestCaseModel, methodName: string, dataShareResp: any, requestId: string, referenceId: string, galleryIds: any[]) {
    let request: any = {};
    if (methodName == appConstants.ABIS_METHOD_INSERT) {
      request = {
        "id": appConstants.ABIS_INSERT_ID,
        "version": appConstants.ABIS_VERSION,
        "requestId": requestId,
        "requesttime": new Date().toISOString(),
        "referenceId": referenceId,
        "referenceURL": dataShareResp ? dataShareResp["url"] : ""
      };
    }
    if (methodName == appConstants.ABIS_METHOD_IDENTIFY) {
      let galleryAvailable = false;
      galleryIds.forEach(refId => {
        if (refId["referenceId"] != "") {
          galleryAvailable = true;
        }
      });
      //console.log(galleryIds);
      //console.log(`galleryAvailable: ${galleryAvailable}`);
      if (galleryAvailable) {
        request = {
          "id": appConstants.ABIS_IDENTIFY_ID,
          "version": appConstants.ABIS_VERSION,
          "requestId": requestId,
          "requesttime": new Date().toISOString(),
          "referenceId": referenceId,
          "gallery": {
            "referenceIds": galleryIds
          }
        }
        // "referenceUrl": null,
        // "flags": {
        //   "maxResults": 0,
        //   "targetFPIR": 0,
        //   "flag1": "string",
        //   "flag2": "string"
        // }
      } else {
        request = {
          "id": appConstants.ABIS_IDENTIFY_ID,
          "version": appConstants.ABIS_VERSION,
          "requestId": requestId,
          "requesttime": new Date().toISOString(),
          "referenceId": referenceId
        }
      }
    }
    request = Utils.handleInvalidRequestAttribute(testCase, request);
    //console.log(request);
    return JSON.stringify(request);
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
        extraInfoJson: JSON.stringify({
          expectedFailureReason: testCase.otherAttributes.expectedFailureReason,
          expectedDuplicateCount: testCase.otherAttributes.expectedDuplicateCount
        }),
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
    methodRequest: any,
    methodIndex: number
  ) {
    return new Promise((resolve, reject) => {
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        specVersion: testCase.specVersion,
        testDescription: testCase.testDescription,
        requestSchema: testCase.requestSchema[methodIndex],
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

  async expireDataShareUrl(
    dataShareResp: any
  ) {
    let dataShareRequestDto = {
      url: dataShareResp["url"],
      transactionsAllowed: dataShareResp["transactionsAllowed"]
    }
    let request = {
      id: appConstants.DATASHARE_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      metadata: {},
      request: dataShareRequestDto,
    };
    console.log(dataShareResp);
    return new Promise((resolve, reject) => {
      this.dataService.expireDataShareUrl(request).subscribe(
        (response: any) => {
         resolve(response[appConstants.RESPONSE]);
        },
        (errors) => {
          console.log(errors);
          resolve(false);
        }
      );
    });
  }
}
