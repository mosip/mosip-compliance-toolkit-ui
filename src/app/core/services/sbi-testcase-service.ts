import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';
import * as appConstants from 'src/app/app.constants';
import { SbiDiscoverResponseModel } from '../models/sbi-discover';

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
      console.log(methodResponse);
      //now validate the response
      let validationResults = await this.validateResponse(
        testCase,
        methodRequest,
        methodResponse
      );
      resolve(validationResults);
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
      console.log(methodResponse);
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
            console.log(response);
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
        type: appConstants.BIOMETRIC_DEVICE,
      };
    }
    if (testCase.methodName == appConstants.SBI_METHOD_CAPTURE) {
      request = {
        env: appConstants.DEVELOPER,
        purpose: selectedSbiDevice.purpose,
        specVersion: selectedSbiDevice.specVersion,
        timeout: 10000,
        captureTime: new Date().toISOString(),
        transactionId: '1636824682071',
        bio: [
          {
            type: selectedSbiDevice.digitalIdDecoded.type,
            count: testCase.otherAttributes.bioCount,
            exception: testCase.otherAttributes.exceptions,
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: '4',
            deviceSubId: selectedSbiDevice.deviceSubId,
            previousHash: '',
            bioSubType: this.getBioSubType(testCase.otherAttributes.segments),
          },
        ],
        customOpts: null,
      };
    }
    console.log(JSON.stringify(request));

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

  async validateResponse(
    testCase: TestCaseModel,
    methodRequest: any,
    methodResponse: any
  ) {
    return new Promise((resolve, reject) => {
      console.log('validateResponse called');
      let validateRequest = {
        testCaseType: testCase.testCaseType,
        testName: testCase.testName,
        testDescription: testCase.testDescription,
        responseSchema: testCase.responseSchema,
        methodResponse: JSON.stringify(methodResponse),
        methodRequest: JSON.stringify(methodRequest),
        validatorDefs: testCase.validatorDefs,
      };
      console.log(validateRequest);
      let request = {
        id: appConstants.SBI_PROJECT_ADD_ID,
        version: appConstants.VERSION,
        requesttime: new Date().toISOString(),
        request: validateRequest,
      };
      this.dataService.validateResponse(request).subscribe((response) => {
        console.log(response);
        resolve(response);
        //this.testCaseResults = JSON.stringify(response);
      });
    });
  }
}
