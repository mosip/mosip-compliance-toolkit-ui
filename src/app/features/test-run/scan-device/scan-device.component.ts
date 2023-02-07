import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';
import Utils from 'src/app/app.utils';
import { Toast } from '@capacitor/toast';
import { CapacitorIntent } from 'capacitor-intent';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-scan-device',
  templateUrl: './scan-device.component.html',
  styleUrls: ['./scan-device.component.css'],
})
export class ScanDeviceComponent implements OnInit {
  myjson: any = JSON;
  input: any;
  scanForm = new FormGroup({});
  panelOpenState = false;
  scanComplete = false;
  portsData: any[] = [];
  devicesData: any[] = [];
  portDevicesData = new Map();
  subscriptions: Subscription[] = [];
  SBI_PORTS = this.appConfigService.getConfig()['sbiPorts'].split(',');
  previousScanAvailable = false;
  SBI_BASE_URL = this.appConfigService.getConfig()['SBI_BASE_URL'];
  isAndroidAppMode = environment.isAndroidAppMode == 'yes' ? true : false;
  constructor(
    private dialogRef: MatDialogRef<ScanDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {
    dialogRef.disableClose = true;
  }

  async ngOnInit() {
    this.scanForm.addControl(
      'ports',
      new FormControl('', [Validators.required])
    );
    this.scanForm.addControl(
      'devices',
      new FormControl('', [Validators.required])
    );
    this.input = this.data;
    const scannedData = localStorage.getItem(appConstants.SBI_SCAN_DATA);
    if (scannedData != null) {
      try {
        this.populatePreviousScan(scannedData);
      } catch (error) {
        await this.startScan();
      }
    } else {
      await this.startScan();
    }
  }

  populatePreviousScan(scannedData: string) {
    this.portDevicesData = new Map(JSON.parse(scannedData));
    this.scanComplete = true;
    this.previousScanAvailable = true;
    for (const port of this.portDevicesData.keys()) {
      this.portsData.push(port);
    }
    const port = localStorage.getItem(appConstants.SBI_SELECTED_PORT);
    this.scanForm.controls['ports'].setValue(port);
    const devicesDataArr = JSON.parse(this.portDevicesData.get(port));
    this.devicesData = devicesDataArr;
    const device = localStorage.getItem(appConstants.SBI_SELECTED_DEVICE);
    this.scanForm.controls['devices'].setValue(device);
  }

  resetPreviousScan() {
    this.previousScanAvailable = false;
    this.scanForm.controls['ports'].setValue('');
    this.scanForm.controls['devices'].reset();
    this.portsData = [];
    this.devicesData = [];
    this.portDevicesData = new Map();
    localStorage.removeItem(appConstants.SBI_SELECTED_PORT);
    localStorage.removeItem(appConstants.SBI_SELECTED_DEVICE);
    localStorage.removeItem(appConstants.SBI_SCAN_DATA);
    localStorage.removeItem(appConstants.SBI_SCAN_COMPLETE);
  }

  async startScan() {
    this.scanComplete = false;
    this.resetPreviousScan();
    if (!this.isAndroidAppMode) {
      for (const sbiPort of this.SBI_PORTS) {
        await this.scanDevicesWeb(sbiPort);
      }
    } else {
      await this.scanDevicesAndroid(this.input["sbiDeviceType"]);
    }
    if (this.portsData.length > 0) {
      localStorage.setItem(
        appConstants.SBI_SCAN_DATA,
        JSON.stringify([...this.portDevicesData])
      );
    }
    this.scanComplete = true;
  }

  async scanDevicesAndroid(sbiDeviceType: string) {
    this.scanComplete = false;
    console.log("in scanDevicesAndroid method");
    console.log("calling mock sbi");
    return new Promise((resolve, reject) => {
      Toast.show({
        text: 'Searching for SBI devices for : ' + sbiDeviceType,
      });
      CapacitorIntent.startActivity({
        methodType: appConstants.SBI_METHOD_DEVICE,
        action: appConstants.DISCOVERY_INTENT_ACTION,
        extraKey: appConstants.SBI_INTENT_REQUEST_KEY,
        extraValue: sbiDeviceType
      }).then((discoverResult: any) => {
        console.log(discoverResult);
        const discoverStatus = discoverResult[appConstants.STATUS];
        if (discoverStatus == appConstants.RESULT_OK) {
          const discoverResp = JSON.parse(discoverResult[appConstants.RESPONSE]);
          const callbackId = discoverResp[appConstants.CALLBACK_ID];
          console.log(callbackId);
          this.portsData.push(callbackId);
          const decodedData =
            Utils.getDecodedDiscoverDevice(discoverResp);
          console.log(decodedData);
          let decodedDataArr: SbiDiscoverResponseModel[] = [];
          if (decodedData != null) {
            decodedDataArr.push(decodedData);
          }
          this.portDevicesData.set(
            callbackId,
            JSON.stringify(decodedDataArr)
          );
          resolve(true);
        }
      })
        .catch(async (err) => {
          console.log("error recvd");
          console.error(err);
          await Toast.show({
            text: 'Unable to find any SBI devices!',
          });
          resolve(true);
        })
    });
  }

  async scanDevicesWeb(sbiPort: string) {
    const requestBody = {
      type: appConstants.BIOMETRIC_DEVICE,
    };
    let methodUrl =
      this.SBI_BASE_URL + ':' + sbiPort + '/' + appConstants.SBI_METHOD_DEVICE;
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.dataService
          .callSBIMethod(
            methodUrl,
            appConstants.SBI_METHOD_DEVICE_KEY,
            requestBody
          )
          .subscribe(
            (response: any) => {
              if (response) {
                this.portsData.push(sbiPort);
                let data = response;
                let decodedDataArr: SbiDiscoverResponseModel[] = [];
                data.forEach((deviceData: any) => {
                  const decodedData =
                    Utils.getDecodedDiscoverDevice(deviceData);
                  if (decodedData != null) {
                    decodedDataArr.push(decodedData);
                  }
                });
                console.log(decodedDataArr);
                this.portDevicesData.set(
                  sbiPort,
                  JSON.stringify(decodedDataArr)
                );
                resolve(true);
              }
            },
            (error) => {
              resolve(true);
            }
          )
      );
    });
  }

  getDeviceLabel(field: any) {
    if (field) {
      if (!this.isAndroidAppMode) {
        return `Device Id: ${field.deviceId}, Purpose: ${field.purpose}, Device Type: ${field.digitalIdDecoded.type}, Device Sub Type: ${field.digitalIdDecoded.deviceSubType}`;
      } else {
        return `Purpose: ${field.purpose}, Device Type: ${field.digitalIdDecoded.type}, Device Sub Type: ${field.digitalIdDecoded.deviceSubType}`;
      }
    } else {
      return '';
    }
  }

  showDevices() {
    this.devicesData = [];
    try {
      const selectedPort = this.scanForm.controls['ports'].value;
      const devicesDataArr = JSON.parse(this.portDevicesData.get(selectedPort));
      this.devicesData = devicesDataArr;
    } catch (error) {
      this.devicesData = [];
    }
  }

  public save() {
    this.scanForm.controls['ports'].markAsTouched();
    this.scanForm.controls['devices'].markAsTouched();
    if (this.scanForm.valid) {
      localStorage.setItem(appConstants.SBI_SCAN_COMPLETE, 'true');
      localStorage.setItem(
        appConstants.SBI_SELECTED_DEVICE,
        this.scanForm.controls['devices'].value
      );
      localStorage.setItem(
        appConstants.SBI_SELECTED_PORT,
        this.scanForm.controls['ports'].value
      );
      this.dialogRef.close();
    }
  }

  close() {
    this.dialogRef.close();
  }
}
