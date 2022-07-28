import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';
import { TestCaseModel } from '../models/testcase';
import { DataService } from './data-service';

@Injectable({
  providedIn: 'root',
})
export class SbiTestCaseService {
  constructor(
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}

  
  async runCollection(testCasesList: TestCaseModel[]) {
    
    /*testCasesList.forEach(async (testCase) => {
      const requestBody = this.populateSBIRequest(testCase);
      console.log(requestBody);
      if (testCase.methodName == 'device') {
        resp = await this.dataService.callSBIMethod('MOSIPDISC', requestBody, testCase);
      }
      // if (testCase.methodName == 'capture') {
      //this.callSBIMethod('CAPTURE', requestBody, testCase);
      //}
    });*/
    const requestBody = this.populateSBIRequest(testCasesList[0]);
    console.log(requestBody);
    if (testCasesList[0].methodName == 'device') {
      // await this.dataService.callSBIMethod('MOSIPDISC', requestBody, testCasesList[0]).subscribe((response: any) => {
      //   console.log(response);
      //   return response;
      // });
      let res = await this.callSBIMethod('MOSIPDISC', requestBody, testCasesList[0]);
      return res;
    }
    
  }

  callSBIMethod(methodType: string, requestBody: any, testCase: any) {
    const url = this.appConfigService.getConfig()['SBI_BASE_URL'];
    const port = '4501';
    const methodName = testCase.methodName;
    let methodUrl = url + ':' + port + '/' + methodName;
    console.log(methodUrl);
    this.dataService
      .callSBIMethod(methodName, methodType, requestBody)
      .subscribe(
        (response) => {
          console.log(response);
          //this.dataSource = response;
          // dialog.open(DialogComponent, {
          //   data: {
          //     testCase: testCase,
          //     methodRequest: requestBody,
          //     methodResponse: response,
          //     methodStatus: 'Success',
          //   },
          // });
        },
        (error) => {
          // dialog.open(DialogComponent, {
          //   data: {
          //     testCase: testCase,
          //     methodRequest: requestBody,
          //     methodName: methodName,
          //     methodResponse: error,
          //     methodStatus: 'error',
          //   },
          // });
        }
      );
  }

  populateSBIRequest(testCase: any): any {
    let request = {};
    if (testCase.methodName == 'device') {
      request = {
        type: 'Biometric Device',
      };
    }
    if (testCase.methodName == 'capture') {
      request = {
        env: 'Developer',
        purpose: testCase.otherAttributes.purpose[0],
        specVersion: testCase.specVersion,
        timeout: 10000,
        captureTime: new Date().toISOString(),
        transactionId: '1636824682071',
        bio: [
          {
            type: testCase.otherAttributes.biometricTypes[0],
            count: testCase.otherAttributes.bioCount,
            exception: testCase.otherAttributes.exceptions,
            requestedScore: testCase.otherAttributes.requestedScore,
            deviceId: '4',
            deviceSubId: testCase.otherAttributes.deviceSubId,
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

}
