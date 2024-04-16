import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from './core/components/dialog/dialog.component';
import { SbiDiscoverResponseModel } from './core/models/sbi-discover';
import { TestCaseModel } from './core/models/testcase';
import * as appConstants from 'src/app/app.constants';
import { BreadcrumbService } from 'xng-breadcrumb';
import { DataService } from './core/services/data-service';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SdkProjectModel } from './core/models/sdk-project';
import { AbisProjectModel } from './core/models/abis-project';
import { SbiProjectModel } from './core/models/sbi-project';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { sha256 } from 'js-sha256';
import { MatTableDataSource } from '@angular/material/table';
import { App } from '@capacitor/app';
import { environment } from 'src/environments/environment';
export default class Utils {
  static getCurrentDate() {
    let now = new Date();
    let isoDate = new Date(now).toISOString();
    return isoDate;
  }

  static chkDeviceTypeSubTypeForDeviceInfo(
    deviceInfoDecoded: any,
    selectedSbiDevice: SbiDiscoverResponseModel
  ): boolean {
    if (
      deviceInfoDecoded != null &&
      deviceInfoDecoded['deviceInfoDecoded'] &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded'] &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded']['type'] ==
      selectedSbiDevice.digitalIdDecoded.type &&
      deviceInfoDecoded['deviceInfoDecoded']['digitalIdDecoded'][
      'deviceSubType'
      ] == selectedSbiDevice.digitalIdDecoded.deviceSubType
    ) {
      return true;
    } else {
      return false;
    }
  }

  static chkDeviceTypeSubTypeForData(
    decodedData: any,
    selectedSbiDevice: SbiDiscoverResponseModel
  ): boolean {
    if (
      decodedData != null &&
      decodedData['dataDecoded'] &&
      decodedData['dataDecoded']['digitalIdDecoded'] &&
      decodedData['dataDecoded']['digitalIdDecoded']['type'] ==
      selectedSbiDevice.digitalIdDecoded.type &&
      decodedData['dataDecoded']['digitalIdDecoded']['deviceSubType'] ==
      selectedSbiDevice.digitalIdDecoded.deviceSubType
    ) {
      return true;
    } else {
      return false;
    }
  }
  static getDecodedDiscoverDevice(deviceData: any) {
    try {
      //console.log(deviceData);
      if (deviceData.digitalId) {
        const digitalIdDecoded = JSON.parse(atob(deviceData.digitalId));
        const deviceDataDecoded: SbiDiscoverResponseModel = {
          ...deviceData,
          digitalIdDecoded: digitalIdDecoded,
        };
        //console.log('decoded');
        //console.log(deviceDataDecoded);
        return deviceDataDecoded;
      } else {
        return deviceData;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedDeviceInfo(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any;
      if (deviceInfoResp.deviceInfo) {
        deviceInfoDecoded = Utils.parsePayload(deviceInfoResp.deviceInfo);
      }
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = Utils.parsePayload(deviceInfoDecoded.digitalId);
      }
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error: deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
      //console.log('deviceInfoDecodedFull');
      //console.log(deviceInfoDecodedFull);
      return deviceInfoDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedUnregistetedDeviceInfo(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any;
      if (deviceInfoResp.deviceInfo) {
        deviceInfoDecoded = JSON.parse(atob(deviceInfoResp.deviceInfo));
      }
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = JSON.parse(atob(deviceInfoDecoded.digitalId));
      }
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error: deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
      return deviceInfoDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedDataInfo(dataResp: any) {
    try {
      let dataDecoded: any;
      if (dataResp.data) {
        dataDecoded = Utils.parsePayload(dataResp.data);
      }
      let digitalIdDecoded: any;
      if (dataDecoded && dataDecoded.digitalId) {
        digitalIdDecoded = Utils.parsePayload(dataDecoded.digitalId);
      }
      dataDecoded = {
        ...dataDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const dataDecodedFull = {
        error: dataResp.error,
        hash: dataResp.hash,
        sessionKey: dataResp.sessionKey,
        specVersion: dataResp.specVersion,
        thumbprint: dataResp.thumbprint,
        data: dataResp.data,
        dataDecoded: dataDecoded,
      };
      return dataDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static getDecodedUnregistetedData(deviceInfoResp: any) {
    try {
      let deviceInfoDecoded: any;
      if (deviceInfoResp.deviceInfo) {
        deviceInfoDecoded = JSON.parse(atob(deviceInfoResp.deviceInfo));
      }
      let digitalIdDecoded: any;
      if (deviceInfoDecoded && deviceInfoDecoded.digitalId) {
        digitalIdDecoded = JSON.parse(deviceInfoDecoded.digitalId);
      }
      deviceInfoDecoded = {
        ...deviceInfoDecoded,
        digitalIdDecoded: digitalIdDecoded,
      };
      const deviceInfoDecodedFull = {
        error: deviceInfoResp.error,
        deviceInfo: deviceInfoResp.deviceInfo,
        deviceInfoDecoded: deviceInfoDecoded,
      };
      return deviceInfoDecodedFull;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static parsePayload(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  static showSuccessMessage(resourceBundle: any, titleKey: string, messageKey: string, dialog: MatDialog, customMsg?: string) {
    let title: any;
    let message: any;
    if (resourceBundle && resourceBundle[titleKey] && resourceBundle[messageKey]) {
      title = resourceBundle[titleKey];
      message = resourceBundle[messageKey];
    } else {
      title = titleKey;
      message = messageKey;
    }
    if (customMsg) {
      message = message + " " + customMsg;
    }
    const body = {
      case: 'SUCCESS',
      title: title,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }

  static showErrorMessage(
    resourceBundle: any,
    errorsList: any,
    dialog: MatDialog,
    customMsg?: string,
    showErrCode?: boolean,
    customErrorCode?: string
  ) {
    const titleOnError = resourceBundle.serviceErrors['error'] ? resourceBundle.serviceErrors['error'] : 'Error';
    let message = '';
    if (errorsList && errorsList.length > 0) {
      let error = errorsList[0];
      //check if translation is available
      const serviceErrorMessages = resourceBundle['serviceErrors'];
      const translatedMsg = Utils.getTranslatedMessage(serviceErrorMessages, error.errorCode);
      if (!showErrCode) {
        if (translatedMsg) {
          message = translatedMsg;
        } else {
          message = error.message;
        }
      } else {
        if (translatedMsg) {
          message = error.errorCode
            ? error.errorCode + ' - ' + translatedMsg
            : translatedMsg;
        } else {
          message = error.errorCode
            ? error.errorCode + ' - ' + error.message
            : error.message;
        }
      }
    }
    if (customMsg) {
      message = customErrorCode ? resourceBundle.serviceErrors[customErrorCode] : customMsg;
    }
    if (message == '') {
      message = 'Unexpected error occured.';
    }
    const body = {
      case: 'ERROR',
      title: titleOnError,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }

  static getTranslatedMessage(resourceBundleMessages: any, messageKey: string) {
    const COMMA_SEPARATOR = ',';
    let translatedMsg = '';
    if (messageKey && resourceBundleMessages) {
      //case 1 "VALIDATOR_MSG_001"
      //case 2 "VALIDATOR_MSG_001::arg1"
      //case 3 "VALIDATOR_MSG_001::arg1;arg2"
      //case 4 "VALIDATOR_MSG_001::VALIDATOR_MSG_002;arg2"
      //case 5 "VALIDATOR_MSG_001,VALIDATOR_MSG_002::arg1;arg2,VALIDATOR_MSG_003::arg3"
      //case 6 "VALIDATOR_MSG_001,textMessage,VALIDATOR_MSG_003::arg3"
      //Eg: messageKey = "ISO_VALIDATOR_003,ISO_VALIDATOR_004::0x46495200,ISO_VALIDATOR_005::0x46495201";
      const messageKeyArr = messageKey.split(COMMA_SEPARATOR);
      messageKeyArr.forEach((messageKey: any) => {
        translatedMsg = translatedMsg + this.performTranslation(messageKey, resourceBundleMessages);
      });
    }
    return translatedMsg;
  }

  static performTranslation(messageKey: any, resourceBundleMessages: any) {
    const COLON_SEPARATOR = '::', SEMI_COLON_SEPARATOR = ';', JSON_PLACEHOLDER = '{}';

    messageKey = messageKey.trim();
    //console.log(messageKey);
    if (messageKey != '') {
      let translatedMsg = '';
      //check if the messageKey is having any rutime attributes
      //eg: messageKey="SCHEMA_VALIDATOR_001::name,size"
      if (messageKey.indexOf(COLON_SEPARATOR) == -1) {
        translatedMsg = resourceBundleMessages[messageKey] ? resourceBundleMessages[messageKey] : messageKey;
        return translatedMsg;
      } else {
        //create an arr of attributes
        let messageKeyArr = messageKey.split(COLON_SEPARATOR);
        const messageKeyName = messageKeyArr[0];
        const argumentsArr = messageKeyArr[1].split(SEMI_COLON_SEPARATOR);
        translatedMsg = resourceBundleMessages[messageKeyName];
        const matches: RegExpMatchArray | null = translatedMsg.match(/\{\}/g);
        const count: number = matches ? matches.length : 0;
        //match no of palceholders in JSON value to no of arguments
        if (count != argumentsArr.length) {
          return translatedMsg;
        }
        let translatedMsgArray = translatedMsg.split(JSON_PLACEHOLDER);
        if (translatedMsgArray.length > 0) {
          let newTranslatedMsg = "";
          translatedMsgArray.forEach((element, index) => {
            if (argumentsArr.length > index) {
              // check if the argument is actually a key in resource bundle, 
              // eg: messageKey="SCHEMA_VALIDATOR_001::SCHEMA_VALIDATOR_002;SCHEMA_VALIDATOR_003"
              const arg = argumentsArr[index];
              const translatedArg = resourceBundleMessages[arg];
              if (translatedArg) {
                newTranslatedMsg = newTranslatedMsg + element + translatedArg;
              } else {
                newTranslatedMsg = newTranslatedMsg + element + arg;
              }
            } else {
              newTranslatedMsg = newTranslatedMsg + element;
            }
          });
          return newTranslatedMsg;
        } else {
          return translatedMsg;
        }
      }
    }
    return messageKey;
  }

  static translateTestcase(
    testcase: any,
    resourceBundle: any
  ) {
    if (resourceBundle && resourceBundle.testcases != null && resourceBundle.testcases[testcase.testId] != null) {
      testcase.testName = resourceBundle.testcases[testcase.testId]['testName'];
      testcase.testDescription = resourceBundle.testcases[testcase.testId]['testDescription'];
      for (const validators of testcase.validatorDefs) {
        for (const validator of validators) {
          validator.description = resourceBundle.validators[validator.name]
            ? resourceBundle.validators[validator.name]
            : validator.description;
        }
      }
    }
    return testcase;
  }

  static handleInvalidRequestAttribute(testCase: TestCaseModel, request: any) {
    if (testCase.otherAttributes.invalidRequestAttribute) {
      // console.log(`invalidRequestAttribute: ${testCase.otherAttributes.invalidRequestAttribute}`);
      let newRequest: any = {};
      let invalidKey = testCase.otherAttributes.invalidRequestAttribute;
      if (invalidKey == 'newUnknownValue') {
        request = {
          ...request,
          "newUnknownValue": "testing with newUnknownValue"
        }
        newRequest = request
      }
      else if (invalidKey == 'biometricTypes') {
        request['type'] = request['type'].toUpperCase();
        newRequest = request;
      }
      else if (invalidKey == 'incorrectReferenceURL') {
        let correctVal = request["referenceURL"];
        let incorrectVal = correctVal.replace("datashare", "datashare1");
        request["referenceURL"] = incorrectVal;
        newRequest = request;
      }
      else if (invalidKey == 'invalidReferenceURL') {
        let correctVal = request["referenceURL"];
        let incorrectVal = correctVal.replace("/", ":");
        request["referenceURL"] = incorrectVal;
        newRequest = request;
      }
      else if (invalidKey == 'invalidRequestTime') {
        let correctVal = request["requesttime"];
        let incorrectVal = new Date(correctVal).toUTCString();
        request["requesttime"] = incorrectVal;
        newRequest = request;
      }
      else if (invalidKey == 'invalidId' &&
        (testCase.methodName[0] == appConstants.ABIS_METHOD_INSERT || testCase.methodName[0] == appConstants.ABIS_METHOD_IDENTIFY)) {
        request["id"] = "abis.invalid.id";
        newRequest = request;
      }
      else if (
        invalidKey.includes('[') &&
        invalidKey.includes(']') &&
        invalidKey.includes('.')
      ) {
        newRequest = request;
        let splitArr = invalidKey.split('[');
        if (splitArr.length > 0) {
          let firstPart = splitArr[0];
          let nestedObj = request[firstPart][0];
          let secondSplitArr = invalidKey.split('.');
          let newNestedRequest = this.changeKeyName(nestedObj, secondSplitArr[1]);
          newRequest[firstPart] = [newNestedRequest];
        }
      } else if (invalidKey.includes('.')) {
        newRequest = request;
        let splitArr = invalidKey.split('.');
        if (splitArr.length > 0) {
          let nestedObj = request[splitArr[0]];
          let newNestedRequest = this.changeKeyName(nestedObj, splitArr[1]);
          newRequest[splitArr[0]] = newNestedRequest;
        }
      } else {
        newRequest = this.changeKeyName(request, invalidKey);
      }
      return newRequest;
    }
    return request;
  }

  static changeKeyName(request: any, invalidKeyName: any) {
    let newRequest: any = {};
    var keys = Object.keys(request);
    for (const key of keys) {
      const keyName = key.toString();
      if (invalidKeyName === keyName) {
        const invalidKeyName = keyName + 'XXX';
        newRequest[invalidKeyName] = request[keyName];
      } else {
        const val = request[keyName];
        newRequest[keyName] = val;
      }
    }
    return newRequest;
  }

  static getResourceBundle(lang: any, dataService: any) {
    return new Promise((resolve, reject) => {
      dataService.getResourceBundle(lang).subscribe(
        (response: any) => {
          //console.log(response);
          resolve(response);
        },
        (errors: any) => {
          console.log(errors);
          resolve(false);
        }
      )
    });
  }

  static getBioTestDataNames(subscriptions: Subscription[], dataService: DataService, purpose: string, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise<string[]>((resolve, reject) => {
      subscriptions.push(
        dataService.getBioTestDataNames(purpose).subscribe(
          (response: any) => {
            resolve(response[appConstants.RESPONSE]);
          },
          (errors) => {
            Utils.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(errors);
          }
        )
      );
    });
  }

  static getSbiProjectDetails(projectId: string, dataService: DataService, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      dataService.getSbiProject(projectId).subscribe(
        (response: any) => {
          // console.log(response['response']);
          resolve(response['response']);
        },
        (errors: any) => {
          this.showErrorMessage(resourceBundleJson, errors, dialog);
          resolve(false);
        }
      )
    });
  }

  static getSdkProjectDetails(projectId: string, dataService: DataService, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      dataService.getSdkProject(projectId).subscribe(
        (response: any) => {
          // console.log(response['response']);
          resolve(response['response']);
        },
        (errors: any) => {
          this.showErrorMessage(resourceBundleJson, errors, dialog);
          resolve(false);
        }
      )
    });
  }

  static getAbisProjectDetails(projectId: string, dataService: DataService, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      dataService.getAbisProject(projectId).subscribe(
        (response: any) => {
          // console.log(response['response']);
          resolve(response['response']);
        },
        (errors: any) => {
          this.showErrorMessage(resourceBundleJson, errors, dialog);
          resolve(false);
        }
      )
    });
  }

  static populateSbiProjectForm(projectFormData: any, projectForm: FormGroup) {
    if (projectFormData) {
      projectForm.controls['name'].setValue(projectFormData.name);
      projectForm.controls['projectType'].setValue(appConstants.SBI);
      projectForm.controls['sbiSpecVersion'].setValue(
        projectFormData.sbiVersion
      );
      projectForm.controls['sbiPurpose'].setValue(
        projectFormData.purpose
      );
      projectForm.controls['deviceType'].setValue(
        projectFormData.deviceType
      );
      projectForm.controls['deviceSubType'].setValue(
        projectFormData.deviceSubType
      );
      projectForm.controls['sbiHash'].setValue(
        projectFormData.sbiHash
      );
      projectForm.controls['websiteUrl'].setValue(
        projectFormData.websiteUrl
      );
    }
  }

  static populateSdkProjectForm(projectFormData: any, projectForm: FormGroup) {
    if (projectFormData) {
      projectForm.controls['name'].setValue(projectFormData.name);
      projectForm.controls['projectType'].setValue(appConstants.SDK);
      projectForm.controls['sdkUrl'].setValue(projectFormData.url);
      projectForm.controls['sdkSpecVersion'].setValue(
        projectFormData.sdkVersion
      );
      projectForm.controls['sdkPurpose'].setValue(
        projectFormData.purpose
      );
      projectForm.controls['sdkHash'].setValue(
        projectFormData.sdkHash
      );
      projectForm.controls['websiteUrl'].setValue(
        projectFormData.websiteUrl
      );
      projectForm.controls['bioTestData'].setValue(
        projectFormData.bioTestDataFileName
      );
    }
  }

  static populateAbisProjectForm(projectFormData: any, projectForm: FormGroup) {
    if (projectFormData) {
      projectForm.controls['name'].setValue(projectFormData.name);
      projectForm.controls['projectType'].setValue(appConstants.ABIS);
      projectForm.controls['abisUrl'].setValue(projectFormData.url);
      projectForm.controls['inboundQueueName'].setValue(projectFormData.inboundQueueName.trim());
      projectForm.controls['outboundQueueName'].setValue(projectFormData.outboundQueueName.trim());
      projectForm.controls['username'].setValue(projectFormData.username.trim());
      projectForm.controls['password'].setValue(projectFormData.password.trim());
      projectForm.controls['modality'].setValue(projectFormData.modality);
      projectForm.controls['abisSpecVersion'].setValue(
        projectFormData.abisVersion
      );
      projectForm.controls['abisHash'].setValue(
        projectFormData.abisHash
      );
      projectForm.controls['websiteUrl'].setValue(
        projectFormData.websiteUrl
      );
      projectForm.controls['abisBioTestData'].setValue(
        projectFormData.bioTestDataFileName
      );
    }
  }

  static updateSbiProject(subscriptions: Subscription[], dataService: DataService, request: any, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      subscriptions.push(
        dataService.updateSbiProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response, resourceBundleJson, dialog));
          },
          (errors) => {
            Utils.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(false);
          }
        )
      );
    });
  }

  static updateSdkProject(subscriptions: Subscription[], dataService: DataService, request: any, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      subscriptions.push(
        dataService.updateSdkProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response, resourceBundleJson, dialog));
          },
          (errors) => {
            Utils.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(false);
          }
        )
      );
    });
  }

  static updateAbisProject(subscriptions: Subscription[], dataService: DataService, request: any, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise((resolve, reject) => {
      subscriptions.push(
        dataService.updateAbisProject(request).subscribe(
          (response: any) => {
            console.log(response);
            resolve(this.getProjectResponse(response, resourceBundleJson, dialog));
          },
          (errors) => {
            this.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(false);
          }
        )
      );
    });
  }

  static getProjectResponse(response: any, resourceBundleJson: any, dialog: MatDialog) {
    if (response.errors && response.errors.length > 0) {
      this.showErrorMessage(resourceBundleJson, response.errors, dialog);
      return true;
    } else {
      return true;
    }
  }

  static populateSbiProjectData(projectForm: FormGroup, projectId: string, deviceImage1: any, deviceImage2: any,
    deviceImage3: any, deviceImage4: any, isAndroidAppMode: boolean) {
    const projectData: SbiProjectModel = {
      id: projectId,
      name: projectForm.controls['name'].value,
      projectType: projectForm.controls['projectType'].value,
      sbiVersion: projectForm.controls['sbiSpecVersion'].value,
      purpose: projectForm.controls['sbiPurpose'].value,
      deviceType: projectForm.controls['deviceType'].value,
      deviceSubType: projectForm.controls['deviceSubType'].value,
      isAndroidSbi: isAndroidAppMode ? "yes" : "no",
      deviceImage1: deviceImage1,
      deviceImage2: deviceImage2,
      deviceImage3: deviceImage3,
      deviceImage4: deviceImage4,
      sbiHash: projectForm.controls['sbiHash'].value.trim(),
      websiteUrl: projectForm.controls['websiteUrl'].value.trim()
    };
    return projectData;
  }

  static populateSdkProjectData(projectForm: FormGroup, projectId: string) {
    const projectData: SdkProjectModel = {
      id: projectId,
      name: projectForm.controls['name'].value,
      projectType: projectForm.controls['projectType'].value,
      sdkVersion: projectForm.controls['sdkSpecVersion'].value,
      purpose: projectForm.controls['sdkPurpose'].value,
      url: projectForm.controls['sdkUrl'].value,
      sdkHash: projectForm.controls['sdkHash'].value.trim(),
      websiteUrl: projectForm.controls['websiteUrl'].value.trim(),
      bioTestDataFileName: projectForm.controls['bioTestData'].value,
    };
    return projectData;
  }

  static populateAbisProjectData(projectForm: FormGroup, projectId: string) {
    const projectData: AbisProjectModel = {
      id: projectId,
      name: projectForm.controls['name'].value,
      projectType: projectForm.controls['projectType'].value,
      abisVersion: projectForm.controls['abisSpecVersion'].value,
      url: projectForm.controls['abisUrl'].value,
      username: projectForm.controls['username'].value.trim(),
      password: projectForm.controls['password'].value.trim(),
      outboundQueueName: projectForm.controls['outboundQueueName'].value.trim(),
      inboundQueueName: projectForm.controls['inboundQueueName'].value.trim(),
      modality: projectForm.controls['modality'].value,
      abisHash: projectForm.controls['abisHash'].value.trim(),
      websiteUrl: projectForm.controls['websiteUrl'].value.trim(),
      bioTestDataFileName: projectForm.controls['abisBioTestData'].value,
    }
    return projectData;
  }

  static getCollectionNameAndType(subscriptions: Subscription[],
    dataService: DataService,
    collectionId: string,
    resourceBundleJson: any,
    dialog: MatDialog) {
    return new Promise<any>((resolve, reject) => {
      subscriptions.push(
        dataService.getCollection(collectionId).subscribe(
          (response: any) => {
            let collectionRes = {
              "name": response['response']['name'],
              "type": response['response']['collectionType']
            };
            resolve(collectionRes);
          },
          (errors) => {
            this.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(errors);
          }
        )
      );
    });
  }

  static getTestcasesForCollection(subscriptions: Subscription[], dataService: DataService, isAdmin: boolean,
    partnerId: string, collectionId: string, resourceBundleJson: any, dialog: MatDialog) {
    return new Promise<any[]>((resolve, reject) => {
      subscriptions.push(
        dataService.getTestcasesForCollection(isAdmin, partnerId, collectionId).subscribe(
          (response: any) => {
            let testcases = response['response']['testcases'];
            let testcaseArr = [];
            for (let testcase of testcases) {
              testcaseArr.push(this.translateTestcase(testcase, resourceBundleJson));
            }
            //sort the testcases based on the testId
            if (testcaseArr && testcaseArr.length > 0) {
              testcaseArr.sort(function (a: TestCaseModel, b: TestCaseModel) {
                if (a.testId > b.testId) return 1;
                if (a.testId < b.testId) return -1;
                return 0;
              });
            }
            resolve(testcaseArr);
          },
          (errors) => {
            this.showErrorMessage(resourceBundleJson, errors, dialog);
            resolve(errors);
          }
        )
      );
    });
  }

  static initBreadCrumb(resourceBundleJson: any, breadcrumbService: BreadcrumbService, sbiProjectData: any,
    sdkProjectData: any, abisProjectData: any, projectType: string, collectionName: any) {
    const breadcrumbLabels = resourceBundleJson['breadcrumb'];
    if (breadcrumbLabels) {
      breadcrumbService.set('@homeBreadCrumb', `${breadcrumbLabels.home}`);
      if (sbiProjectData) {
        breadcrumbService.set(
          '@projectBreadCrumb',
          `${projectType} ${breadcrumbLabels.project} - ${sbiProjectData.name}`
        );
      }
      if (sdkProjectData) {
        breadcrumbService.set(
          '@projectBreadCrumb',
          `${projectType} ${breadcrumbLabels.project} - ${sdkProjectData.name}`
        );
      }
      if (abisProjectData) {
        breadcrumbService.set(
          '@projectBreadCrumb',
          `${projectType} ${breadcrumbLabels.project} - ${abisProjectData.name}`
        );
      }
      if (collectionName) {
        breadcrumbService.set(
          '@collectionBreadCrumb',
          `${collectionName}`
        );
      } else {
        breadcrumbService.set('@collectionBreadCrumb', `${breadcrumbLabels.add}`);
      }

    }
  }

  static isReportAlreadySubmitted(projectType: string, projectId: string, collectionId: string, dataService: DataService, resourceBundleJson: any, dialog: MatDialog) {
    let reqBody = {
      id: appConstants.PARTNER_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: {
        projectType: projectType,
        projectId: projectId,
        collectionId: collectionId,
        testRunId: null //this is not required to check if report is previously submitted
      },
    };
    return new Promise((resolve, reject) => {
      dataService.isReportAlreadySubmitted(reqBody).subscribe(
        (response: any) => {
          // console.log(response['response']);
          resolve(response['response']);
        },
        (errors: any) => {
          this.showErrorMessage(resourceBundleJson, errors, dialog);
          resolve(false);
        }
      )
    });
  }

  static convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  static getReportFromDb(isAdmin: boolean, element: any, request: any, dataService: any) {
    return new Promise((resolve, reject) => {
      dataService.getReport(isAdmin, element.partnerId, request).subscribe(
        (response: any) => {
          resolve(response);
        },
        (errors: any) => {
          console.log(errors);
          resolve(false);
        }
      )
    });
  }

  static async getReport(isAndroidAppMode: boolean, isAdmin: boolean, element: any,
    dataService: DataService, resourceBundleJson: any, dialog: MatDialog) {
    let reportrequest = {
      projectType: element.projectType,
      projectId: element.projectId,
      collectionId: element.collectionId,
      testRunId: element.runId
    };

    let request = {
      id: isAdmin ? appConstants.ADMIN_REPORT_ID : appConstants.PARTNER_REPORT_ID,
      version: appConstants.VERSION,
      requesttime: new Date().toISOString(),
      request: reportrequest,
    };
    let res: any = await this.getReportFromDb(isAdmin, element, request, dataService);
    if (res) {
      console.log('isAndroidAppMode' + isAndroidAppMode);
      const fileByteArray = res;
      var blob = new Blob([fileByteArray], { type: 'application/pdf' });
      const base64 = await this.convertBlobToBase64(blob) as string;
      const hash = sha256(base64);
      console.log(hash.toString());
      if (isAndroidAppMode) {
        //let fileName = element.projectName + ".pdf";
        let fileName = hash + ".pdf";
        console.log('ready to download');
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents
        });
        Toast.show({
          text: 'File has been downloaded to Documents folder: ' + fileName,
        }).catch((error) => {
          console.log(error);
        });
      } else {
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = hash;
        link.click();
      }
    } else {
      Utils.showErrorMessage(resourceBundleJson,
        null,
        dialog,
        'Unable to download PDF file. Try Again!');
    }
  }

  static isConsentGiven(dataService: DataService, resourceBundleJson: any, dialog: MatDialog, version: string) {
    return new Promise((resolve, reject) => {
      dataService.isConsentGiven(version).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            Utils.showConsentError(resourceBundleJson, response.errors, dialog);
            reject(response.errors);
          } else {
            resolve(response['response']);
          }
        },
        (errors: any) => {
          this.showConsentError(resourceBundleJson, errors, dialog);
          reject(errors);
        }
      )
    });
  }

  static getTemplate(dataService: DataService, resourceBundleJson: any, dialog: MatDialog, langCode: string, templateName: string, version: string) {
    return new Promise((resolve, reject) => {
      dataService.getTemplate(langCode, templateName, version).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            Utils.showConsentError(resourceBundleJson, response.errors, dialog);
            reject(response.errors);
          } else {
            resolve(response['response']['template']);
          }
        },
        (errors: any) => {
          Utils.showConsentError(resourceBundleJson, errors, dialog);
          reject(errors);
        }
      );
    });
  }

  static getLatestTemplateVersion(dataService: DataService, resourceBundleJson: any, dialog: MatDialog, templateName: string) {
    return new Promise<string>((resolve, reject) => {
      dataService.getLatestTemplateVersion(templateName).subscribe(
        (response: any) => {
          if (response.errors && response.errors.length > 0) {
            Utils.showConsentError(resourceBundleJson, response.errors, dialog);
            reject(response.errors);
          } else {
            resolve(response['response']);
          }
        },
        (errors: any) => {
          Utils.showConsentError(resourceBundleJson, errors, dialog);
          reject(errors);
        }
      );
    });
  }

  static showConsentError(
    resourceBundle: any,
    errorsList: any,
    dialog: MatDialog,
    customMsg?: string,
    showErrCode?: boolean,
    customErrorCode?: string
  ) {
    const titleOnError = resourceBundle.serviceErrors['error'] ? resourceBundle.serviceErrors['error'] : 'Error';
    let message = '';
    if (errorsList && errorsList.length > 0) {
      let error = errorsList[0];
      const translatedMsg = resourceBundle.serviceErrors[error.errorCode];
      if (!showErrCode) {
        if (translatedMsg) {
          message = translatedMsg;
        } else {
          message = error.message;
        }
      } else {
        if (translatedMsg) {
          message = error.errorCode
            ? error.errorCode + ' - ' + translatedMsg
            : translatedMsg;
        } else {
          message = error.errorCode
            ? error.errorCode + ' - ' + error.message
            : error.message;
        }
      }
    }
    if (customMsg) {
      message = customErrorCode ? resourceBundle.serviceErrors[customErrorCode] : customMsg;
    }
    if (message == '') {
      message = 'Unexpected error occured.';
    }
    const body = {
      case: 'TERMS_AND_CONDITIONS_CONSENT_ERROR',
      title: titleOnError,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }

  static showConsentPrompt(resourceBundle: any, titleKey: string, messageKey: string, dialog: MatDialog, customMsg?: string) {
    let title: any;
    let message: any;
    if (resourceBundle && resourceBundle[titleKey] && resourceBundle[messageKey]) {
      title = resourceBundle[titleKey];
      message = resourceBundle[messageKey];
    } else {
      title = titleKey;
      message = messageKey;
    }
    if (customMsg) {
      message = message + " " + customMsg;
    }
    const body = {
      case: 'TERMS_AND_CONDITIONS_CONSENT_ERROR',
      title: title,
      message: message,
    };
    const dialogRef = dialog.open(DialogComponent, {
      width: '400px',
      data: body,
    });
    return dialogRef;
  }

  static applyFilter<T>(event: Event, dataSource: MatTableDataSource<T>): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    dataSource.filter = filterValue;
    if (dataSource.paginator) {
      dataSource.paginator.firstPage();
    }
  }

  static androidAppExit(resourceBundleJson: any, dialog: MatDialog) {
    const isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
    if (isAndroidAppMode) {
      let resourceBundle = resourceBundleJson.dialogMessages;
      let successMsg = 'success';
      let logoutMsg = 'logoutMessage';
      const dialogRef = Utils.showSuccessMessage(
        resourceBundle,
        successMsg,
        logoutMsg,
        dialog
      );
      dialogRef.afterClosed().subscribe((res) => {
        App.exitApp().catch((error) => {
          console.log(error);
        });
      });
    }
  }

}
