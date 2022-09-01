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
    return this.httpClient.get(url);
  }

  addSbiProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}addSbiProject`;
    return this.httpClient.post(url, body);
  }

  addSdkProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}addSdkProject`;
    return this.httpClient.post(url, body);
  }

  getSbiProject(projectId: string) {
    let url = `${this.SERVICES_BASE_URL}getSbiProject/${projectId}`;
    return this.httpClient.get(url);
  }

  getSdkProject(projectId: string) {
    let url = `${this.SERVICES_BASE_URL}getSdkProject/${projectId}`;
    return this.httpClient.get(url);
    //return this.httpClient.get('./assets/sdkproject.json');
  }

  updateSdkProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}updateSdkProject`;
    return this.httpClient.put(url, body);
  }

  getCollections(projectId: string, projectType: string) {
    let url = `${this.SERVICES_BASE_URL}getCollections?projectId=${projectId}&type=${projectType}`;
    return this.httpClient.get(url);
  }

  addCollection(body: any) {
    let url = `${this.SERVICES_BASE_URL}addCollection`;
    return this.httpClient.post(url, body);
  }

  getCollection(collectionId: string) {
    let url = `${this.SERVICES_BASE_URL}getCollection/${collectionId}`;
    return this.httpClient.get(url);
  }

  addTestcasesForCollection(body: any) {
    let url = `${this.SERVICES_BASE_URL}addTestCasesForCollection`;
    return this.httpClient.post(url, body);
  }

  getTestcasesForCollection(collectionId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestCasesForCollection/${collectionId}`;
    return this.httpClient.get(url);
  }

  getSbiTestCases(
    specVersion: string,
    purpose: string,
    deviceType: string,
    deviceSubType: string
  ) {
    let url = `${this.SERVICES_BASE_URL}getSbiTestCases?specVersion=${specVersion}&purpose=${purpose}&deviceType=${deviceType}&deviceSubType=${deviceSubType}`;
    return this.httpClient.get(url);
  }

  getSdkTestCases(specVersion: string, sdkPurpose: string) {
    let url = `${this.SERVICES_BASE_URL}getSdkTestCases?specVersion=${specVersion}&sdkPurpose=${sdkPurpose}`;
    return this.httpClient.get(url);
  }

  validateRequest(body: any) {
    let url = `${this.SERVICES_BASE_URL}validateRequest`;
    return this.httpClient.post(url, body);
  }

  validateResponse(body: any) {
    let url = `${this.SERVICES_BASE_URL}validateResponse`;
    return this.httpClient.post(url, body);
  }

  addTestRun(body: any) {
    let url = `${this.SERVICES_BASE_URL}addTestRun`;
    return this.httpClient.post(url, body);
  }

  updateTestRun(body: any) {
    let url = `${this.SERVICES_BASE_URL}updateTestRun`;
    return this.httpClient.put(url, body);
  }

  addTestRunDetails(body: any) {
    let url = `${this.SERVICES_BASE_URL}addTestRunDetails`;
    return this.httpClient.post(url, body);
  }

  getTestRunDetails(runId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestRunDetails/${runId}`;

    return this.httpClient.get(url);
  }

  getTestCase(testId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestCase/${testId}`;

    return this.httpClient.get(url);
  }

  getTestRunHistory(collectionId: string, pageNo: any, pageSize: any) {
    let url = `${this.SERVICES_BASE_URL}getTestRunHistory?collectionId=${collectionId}&pageNo=${pageNo}&pageSize=${pageSize}`;
    return this.httpClient.get(url);
  }

  getTestRunStatus(runId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestRunStatus/${runId}`;
    return this.httpClient.get(url);
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
    return this.httpClient.get(url);
  }

  getBiometricTestData() {
    let url = `${this.SERVICES_BASE_URL}getBiometricTestData`;
    return this.httpClient.get(url);
  }
}
