import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private httpClient: HttpClient,
    private appConfigService: AppConfigService
  ) {}

  SERVICES_BASE_URL = this.appConfigService.getConfig()['SERVICES_BASE_URL'];
  SBI_BASE_URL = this.appConfigService.getConfig()['SBI_BASE_URL'];

  getProjects() {
    let url = `${this.SERVICES_BASE_URL}getProjects`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  addSbiProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}addSbiProject`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  getSbiProject(projectId: string) {
    let url = `${this.SERVICES_BASE_URL}getSbiProject/${projectId}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  getCollections(projectId: string, projectType: string) {
    let url = `${this.SERVICES_BASE_URL}getCollections?projectId=${projectId}&type=${projectType}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  addCollection(body: any) {
    let url = `${this.SERVICES_BASE_URL}addCollection`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  addCollectionTestcases(body: any) {
    let url = `${this.SERVICES_BASE_URL}addCollectionTestcases`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  getSbiTestCases(
    specVersion: string,
    purpose: string,
    deviceType: string,
    deviceSubType: string
  ) {
    let url = `${this.SERVICES_BASE_URL}getSbiTestCases?specVersion=${specVersion}&purpose=${purpose}&deviceType=${deviceType}&deviceSubType=${deviceSubType}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  validateRequest(body: any) {
    let url = `${this.SERVICES_BASE_URL}validateRequest`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  validateResponse(body: any) {
    let url = `${this.SERVICES_BASE_URL}validateResponse`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  callSBIMethod(
    port: string,
    methodName: string,
    methodType: string,
    requestBody: any
  ) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json',
    });
    let methodUrl = this.SBI_BASE_URL + ':' + port + '/' + methodName;
    return this.httpClient.request(methodType, methodUrl, {
      body: requestBody,
      headers: headers,
    });
  }

  callSDKMethod(url: string, body: any) {
    console.log('url:' + url);
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json',
    });
    return this.httpClient.post(url, body, { headers: headers });
  }

  generateRequestForSDK(
    methodName: string,
    testcaseId: string,
    modalities: string
  ) {
    let url = `${this.SERVICES_BASE_URL}generateRequestForSDK?methodName=${methodName}&testcaseId=${testcaseId}&modalities=${modalities}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }
}
