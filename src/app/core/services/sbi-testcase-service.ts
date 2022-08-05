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
        validationResponse: validationResponse
      }
      resolve(finalResponse);
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
        methodName
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
        type: selectedSbiDevice.digitalIdDecoded.type
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
        if (deviceData.deviceId === selectedSbiDevice.deviceId) {
          const decodedData = Utils.getDecodedDiscoverDevice(deviceData);
          if (decodedData != null) {
            decodedDataArr.push(decodedData);
          }
        }
      });
      return decodedDataArr;
    }
    if (testCase.methodName == appConstants.SBI_METHOD_DEVICE_INFO) {
      let decodedDataArr: any[] = [];
      methodResponse.forEach((deviceInfo: any) => {
        //if (deviceInfo.deviceId === selectedSbiDevice.deviceId) {
          const decodedData = Utils.getDecodedDeviceInfo(deviceInfo);
          if (decodedData != null) {
            decodedDataArr.push(decodedData);
          }
        //}
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
}
