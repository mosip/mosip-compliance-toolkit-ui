import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';
import Utils from 'src/app/app.utils';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}

  async runTestCase(
    testCase: TestCaseModel,
    sbiSelectedPort: string,
    sbiSelectedDevice: string
  ) {
    return new Promise(async (resolve, reject) => {
      const methodRequest = this.createRequest(testCase, sbiSelectedDevice);
      //now validate the response
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
          sbiSelectedPort,
          methodRequest
        );
        const decodedMethodResp = this.createDecodedResponse(
          testCase,
          methodResponse,
          sbiSelectedDevice
        );
        //now validate the response
        let validationResponse = await this.validateResponse(
          testCase,
          methodRequest,
          decodedMethodResp
        );
        let finalResponse = {
          methodResponse: JSON.stringify(methodResponse),
          methodRequest: JSON.stringify(methodRequest),
          validationResponse: validationResponse,
        };
        resolve(finalResponse);
      } else {
        let validationResponse = {
          response: {
            validationsList: [validationRequest[appConstants.RESPONSE]],
          },
          errors: []
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

  async executeMethod(
    methodName: string,
    sbiSelectedPort: string,
    methodRequest: any
  ) {
    if (methodName == appConstants.SBI_METHOD_DEVICE) {
      let methodResponse = await this.callSBIMethod(
        sbiSelectedPort,
        appConstants.SBI_METHOD_DEVICE_KEY,
        methodRequest,
        methodName
      );
      //console.log(methodResponse);
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let methodResponse = await this.callSBIMethod(
        sbiSelectedPort,
        appConstants.SBI_METHOD_DEVICE_INFO_KEY,
        methodRequest,
        methodName
      );
      //console.log(methodResponse);
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_CAPTURE) {
      let methodResponse = await this.callSBIMethod(
        sbiSelectedPort,
        appConstants.SBI_METHOD_CAPTURE_KEY,
        methodRequest,
        methodName
      );
      return methodResponse;
    }
    if (methodName == appConstants.SBI_METHOD_RCAPTURE) {
      let methodResponse = await this.callSBIMethod(
        sbiSelectedPort,
        appConstants.SBI_METHOD_RCAPTURE_KEY,
        methodRequest,
        appConstants.SBI_METHOD_CAPTURE
      );
      return methodResponse;
    }
  }

  callSBIMethod(
    port: string,
    methodType: string,
    requestBody: any,
    methodName: string
  ) {
    return new Promise((resolve, reject) => {
      this.dataService
        .callSBIMethod(port, methodName, methodType, requestBody)
        .subscribe(
          (response) => {
            //console.log(response);
            //return response;
            resolve(response);
          },
          (error) => {}
        );
    });
  }

  createRequest(testCase: TestCaseModel, sbiSelectedDevice: string): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    let request = {};
    if (testCase.methodName == appConstants.SBI_METHOD_DEVICE) {
      request = {
        type: selectedSbiDevice.digitalIdDecoded.type,
      };
    }
    if (testCase.methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      //no params
    }
    if (testCase.methodName == appConstants.SBI_METHOD_CAPTURE) {
      request = {
        env: appConstants.DEVELOPER,
        purpose: selectedSbiDevice.purpose,
        specVersion: selectedSbiDevice.specVersion[0],
        timeout: '10000',
        captureTime: new Date().toISOString(),
        transactionId: testCase.testId + '-' + new Date().getUTCMilliseconds(),
        domainUri: '', //TODO
        bio: [
          {
            type: selectedSbiDevice.digitalIdDecoded.type,
            count: parseInt(testCase.otherAttributes.bioCount),
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: selectedSbiDevice.deviceId,
            deviceSubId: selectedSbiDevice.deviceSubId[0],
            previousHash: '',
            bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
          },
        ],
        customOpts: null,
      };
    }
    if (testCase.methodName == appConstants.SBI_METHOD_RCAPTURE) {
      request = {
        env: appConstants.DEVELOPER,
        purpose: selectedSbiDevice.purpose,
        specVersion: selectedSbiDevice.specVersion[0],
        timeout: '10000',
        captureTime: new Date().toISOString(),
        transactionId: testCase.testId + '-' + new Date().getUTCMilliseconds(),
        bio: [
          {
            type: selectedSbiDevice.digitalIdDecoded.type,
            count: parseInt(testCase.otherAttributes.bioCount),
            exception: testCase.otherAttributes.exceptions,
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: selectedSbiDevice.deviceId,
            deviceSubId: selectedSbiDevice.deviceSubId[0],
            previousHash: '',
            bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
          },
        ],
        customOpts: null,
      };
    }
    //console.log(JSON.stringify(request));
    return request;
    //return JSON.stringify(request);
  }

  getBioSubType(segments: Array<string>): Array<string> {
    let bioSubTypes = new Array<string>();
    segments.forEach((segment) => {
      let mappedVal = '';
      switch (segment) {
        case 'Left':
          mappedVal = 'Left';
          break;
        case 'Right':
          mappedVal = 'Right';
          break;
        case 'RightIndex':
          mappedVal = 'Right IndexFinger';
          break;
        case 'RightMiddle':
          mappedVal = 'Right MiddleFinger';
          break;
        case 'RightRing':
          mappedVal = 'Right RingFinger';
          break;
        case 'RightLittle':
          mappedVal = 'Right LittleFinger';
          break;
        case 'RightThumb':
          mappedVal = 'Right Thumb';
          break;
        case 'LeftIndex':
          mappedVal = 'Left IndexFinger';
          break;
        case 'LeftMiddle':
          mappedVal = 'Left MiddleFinger';
          break;
        case 'LeftRing':
          mappedVal = 'Left RingFinger';
          break;
        case 'LeftLittle':
          mappedVal = 'Left LittleFinger';
          break;
        case 'LeftThumb':
          mappedVal = 'Left Thumb';
          break;
        case 'Face':
          mappedVal = 'null';
          break;
        case 'UNKNOWN':
          mappedVal = 'UNKNOWN';
          break;
      }
      bioSubTypes.push(mappedVal);
    });
    return bioSubTypes;
  }

  createDecodedResponse(
    testCase: TestCaseModel,
    methodResponse: any,
    sbiSelectedDevice: string
  ): any {
    const selectedSbiDevice: SbiDiscoverResponseModel =
      JSON.parse(sbiSelectedDevice);
    if (testCase.methodName == appConstants.SBI_METHOD_DEVICE) {
      let decodedDataArr: SbiDiscoverResponseModel[] = [];
      methodResponse.forEach((deviceData: any) => {
        const decodedData = Utils.getDecodedDiscoverDevice(deviceData);
        if (decodedData != null) {
          decodedDataArr.push(decodedData);
        }
      });
      return decodedDataArr;
    }
    if (testCase.methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      //device info - unregistered device - sample code for testing
      // methodResponse = [
      //   {
      //     deviceInfo:
      //       'eyJzcGVjVmVyc2lvbiI6WyIwLjkuNSJdLCJlbnYiOiJTdGFnaW5nIiwiZGlnaXRhbElkIjoie1wic2VyaWFsTm9cIjpcIjEyMzQ1Njc5OTBcIixcIm1ha2VcIjpcIk1PU0lQXCIsXCJtb2RlbFwiOlwiU0lOR0xFMDFcIixcInR5cGVcIjpcIkZpbmdlclwiLFwiZGV2aWNlU3ViVHlwZVwiOlwiU2luZ2xlXCIsXCJkZXZpY2VQcm92aWRlcklkXCI6XCJNT1NJUC5QUk9YWS5TQklcIixcImRldmljZVByb3ZpZGVyXCI6XCJNT1NJUFwiLFwiZGF0ZVRpbWVcIjpcIjIwMjItMDgtMDhUMTM6MTA6MTZaXCJ9IiwiZGV2aWNlSWQiOiIiLCJkZXZpY2VDb2RlIjoiIiwicHVycG9zZSI6IiIsInNlcnZpY2VWZXJzaW9uIjoiMC45LjUiLCJkZXZpY2VTdGF0dXMiOiJOb3QgUmVnaXN0ZXJlZCIsImZpcm13YXJlIjoiTU9TSVAuU0lOR0xFLjEuMC4wLjAiLCJjZXJ0aWZpY2F0aW9uIjoiTDAiLCJkZXZpY2VTdWJJZCI6WzBdLCJjYWxsYmFja0lkIjoiaHR0cDovLzEyNy4wLjAuMTo0NTAxLyJ9',
      //     error: {
      //       errorCode: '100',
      //       errorInfo: 'Device not registered',
      //     },
      //   },
      // ];
      let decodedDataArr: any[] = [];
      methodResponse.forEach((deviceInfoResp: any) => {
        if (deviceInfoResp && deviceInfoResp.deviceInfo == '') {
          decodedDataArr.push(deviceInfoResp);
        } else {
          //chk if device is registered
          let arr = deviceInfoResp.deviceInfo.split('.');
          if (arr.length == 3) {
            //this is registered device
            const decodedData = Utils.getDecodedDeviceInfo(deviceInfoResp);
            if (decodedData != null) {
              decodedDataArr.push(decodedData);
            }
          } else {
            //this is unregistered device
            const decodedData =
              Utils.getDecodedUnregistetedDeviceInfo(deviceInfoResp);
            if (decodedData != null) {
              decodedDataArr.push(decodedData);
            }
          }
        }
      });
      return decodedDataArr;
    }
    return methodResponse;
    //return JSON.stringify(request);
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
          console.log(response);
          resolve(response);
        },
        (errors) => {
          resolve(errors);
        }
      );
    });
  }
}
