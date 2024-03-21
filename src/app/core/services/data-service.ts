import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(
    private httpClient: HttpClient,
    private appConfigService: AppConfigService
  ) { }

  SERVICES_BASE_URL = this.appConfigService.getConfig()['SERVICES_BASE_URL'];

  getProjects(type: string) {
    let url;
    if (type != "") {
      url = `${this.SERVICES_BASE_URL}getProjects?type=${type}`;
    } else {
      url = `${this.SERVICES_BASE_URL}getProjects`;
    }
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

  addAbisProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}addAbisProject`;
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

  getAbisProject(projectId: string) {
    let url = `${this.SERVICES_BASE_URL}getAbisProject/${projectId}`;
    return this.httpClient.get(url);
  }

  updateSbiProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}updateSbiProject`;
    return this.httpClient.put(url, body);
  }

  updateSdkProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}updateSdkProject`;
    return this.httpClient.put(url, body);
  }

  updateAbisProject(body: any) {
    let url = `${this.SERVICES_BASE_URL}updateAbisProject`;
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

  getTestcasesForCollection(isAdmin: boolean, partnerId: string, collectionId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestCasesForCollection/${collectionId}`;
    if (isAdmin) {
      url = `${this.SERVICES_BASE_URL}getPartnerTestCasesForCollection/${partnerId}/${collectionId}`;
    }
    return this.httpClient.get(url);
  }

  getSbiTestCases(
    specVersion: string,
    purpose: string,
    deviceType: string,
    deviceSubType: string,
    isAndroidAppMode: boolean
  ) {
    let url = `${this.SERVICES_BASE_URL}getSbiTestCases?specVersion=${specVersion}&purpose=${purpose}&deviceType=${deviceType}&deviceSubType=${deviceSubType}&isAndroid=${isAndroidAppMode}`;
    return this.httpClient.get(url);
  }

  getSdkTestCases(specVersion: string, sdkPurpose: string) {
    let url = `${this.SERVICES_BASE_URL}getSdkTestCases?specVersion=${specVersion}&sdkPurpose=${sdkPurpose}`;
    return this.httpClient.get(url);
  }

  getAbisTestCases(abisSpecVersion: string) {
    let url = `${this.SERVICES_BASE_URL}getAbisTestCases?abisSpecVersion=${abisSpecVersion}`;
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

  deleteTestRun(runId: string) {
    let url = `${this.SERVICES_BASE_URL}deleteTestRun/${runId}`;
    return this.httpClient.delete(url);
  }


  addTestRunDetails(body: any) {
    let url = `${this.SERVICES_BASE_URL}addTestRunDetails`;
    return this.httpClient.post(url, body);
  }

  getTestRunDetails(isAdmin: boolean, partnerId: string, runId: string) {
    let url = `${this.SERVICES_BASE_URL}getTestRunDetails/${runId}`;
    if (isAdmin) {
      url = `${this.SERVICES_BASE_URL}getPartnerTestRunDetails/${partnerId}/${runId}`;
    }
    return this.httpClient.get(url);
  }

  getMethodDetails(isAdmin: boolean, partnerId: string, runId: string, testcaseId: string, methodId: string) {
    let url = `${this.SERVICES_BASE_URL}getMethodDetails/${runId}/${testcaseId}/${methodId}`;
    if (isAdmin) {
      url = `${this.SERVICES_BASE_URL}getPartnerMethodDetails/${partnerId}/${runId}/${testcaseId}/${methodId}`;
    }
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
    methodUrl: string,
    methodType: string,
    requestBody: any
  ) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json',
    });
    //console.log(methodType);
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

  generateRequestForSDK(body: any) {
    let url = `${this.SERVICES_BASE_URL}generateRequestForSDK`;
    //console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  generateRequestForSDKFrmBirs(body: any) {
    let url = `${this.SERVICES_BASE_URL}generateRequestForSDKFrmBirs`;
    //console.log('url:' + url);
    return this.httpClient.post(url, body);
  }

  getListOfBiometricTestData() {
    let url = `${this.SERVICES_BASE_URL}getListOfBiometricTestData`;
    return this.httpClient.get(url);
  }

  getBioTestDataNames(purpose: string) {
    let url = `${this.SERVICES_BASE_URL}getBioTestDataNames?purpose=${purpose}`;
    return this.httpClient.get(url);
  }

  getSampleBioTestDataFile(purpose: string) {
    let url = `${this.SERVICES_BASE_URL}getSampleBioTestDataFile?purpose=${purpose}`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  addBiometricTestData(formdata: FormData) {
    let url = `${this.SERVICES_BASE_URL}addBiometricTestData`;
    return this.httpClient.post(url, formdata);
  }

  getBiometricTestDataFile(fileId: string) {
    let url = `${this.SERVICES_BASE_URL}getBiometricTestDataFile/${fileId}`;
    return this.httpClient.get(url, { responseType: 'blob' });
  }

  getConsentTemplate(langCode: string, templateName: string) {
    const url = `${this.SERVICES_BASE_URL}getConsentTemplate?langCode=${langCode}&templateName=${templateName}`;
    return this.httpClient.get(url);
  }

  savePartnerConsent() {
    const url = `${this.SERVICES_BASE_URL}savePartnerConsent`;
    return this.httpClient.post(url, {});
  }

  getPartnerConsent(templateName: string) {
    let url = `${this.SERVICES_BASE_URL}getPartnerConsent?templateName=${templateName}`;
    return this.httpClient.get(url);
  }

  getEncryptionKey() {
    let url = `${this.SERVICES_BASE_URL}getEncryptionKey`;
    return this.httpClient.get(url);
  }

  createDataShareUrl(body: any) {
    let url = `${this.SERVICES_BASE_URL}createDataShareUrl`;
    return this.httpClient.post(url, body);
  }

  sendToQueue(body: any) {
    let url = `${this.SERVICES_BASE_URL}sendToQueue`;
    return this.httpClient.post(url, body);
  }

  getResourceBundle(langCode: string) {
    return this.httpClient.get(`./assets/i18n/${langCode}.json`).pipe(
      catchError(() => {
        return this.httpClient.get('./assets/i18n/eng.json');
      })
    );
  }

  expireDataShareUrl(body: any) {
    let url = `${this.SERVICES_BASE_URL}expireDataShareUrl`;
    return this.httpClient.post(url, body);
  }

  generateDraftReport(body: any, isComplianceReport: boolean) {
    let url = `${this.SERVICES_BASE_URL}generateDraftReport`;
    if (!isComplianceReport) {
      url = `${this.SERVICES_BASE_URL}generateDraftQAReport`;
    }
    return this.httpClient.post(url, body, { responseType: 'blob' });
  }

  getSubmittedReport(body: any) {
    let url = `${this.SERVICES_BASE_URL}getSubmittedReport`;
    return this.httpClient.post(url, body, { responseType: 'blob' });
  }

  isReportAlreadySubmitted(body: any) {
    let url = `${this.SERVICES_BASE_URL}isReportAlreadySubmitted`;
    return this.httpClient.post(url, body);
  }

  submitReportForReview(body: any) {
    let url = `${this.SERVICES_BASE_URL}submitReportForReview`;
    return this.httpClient.post(url, body);
  }

  getPartnerReportList(reportStatus: string) {
    let url;
    url = `${this.SERVICES_BASE_URL}getPartnerReportList/${reportStatus}`;
    return this.httpClient.get(url);
  }

  getSubmittedReportList() {
    let url;
    url = `${this.SERVICES_BASE_URL}getSubmittedReportList`;
    return this.httpClient.get(url);
  }

  getReport(isAdmin: boolean, partnerId: String, body: any) {
    let url;
    if (isAdmin) {
      url = `${this.SERVICES_BASE_URL}getPartnerReport/${partnerId}`;
    } else {
      url = `${this.SERVICES_BASE_URL}getSubmittedReport`;
    }
    return this.httpClient.post(url, body, { responseType: 'blob' });
  }

  approvePartnerReport(partnerId: String, body: any) {
    let url;
    url = `${this.SERVICES_BASE_URL}approvePartnerReport/${partnerId}`;
    return this.httpClient.post(url, body);
  }

  rejectPartnerReport(partnerId: String, body: any) {
    let url;
    url = `${this.SERVICES_BASE_URL}rejectPartnerReport/${partnerId}`;
    return this.httpClient.post(url, body);
  }
}
