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

  getProjectCollections(projectId: string, projectType: string) {
    let url = `${this.SERVICES_BASE_URL}getProjectCollections?projectId=${projectId}&type=${projectType}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  getSbiProject(projectId: string) {
    let url = `${this.SERVICES_BASE_URL}getSbiProject/${projectId}`;
    console.log('url:' + url);
    return this.httpClient.get(url);
  }

  addSbiProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}addSbiProject`;
    console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  getTestCases(type: string) {
    let url = `${this.SERVICES_BASE_URL}getTestCases?type=${type}`;
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

  callSBIMethod(methodName: string, methodType: string, requestBody: string, ) {
    const port = '4501';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json',
    });
    let methodUrl = this.SBI_BASE_URL + ':' + port + '/' + methodName;
    return this.httpClient.request(methodType, methodUrl, {
      body: requestBody,
      headers: headers 
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
