import { Component, Inject, OnInit, Injectable } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';

@Component({
  selector: 'app-scan-device',
  templateUrl: './scan-device.component.html',
  styleUrls: ['./scan-device.component.css'],
})
export class ScanDeviceComponent implements OnInit {
  input: any;
  scanForm = new FormGroup({});
  panelOpenState = false;
  scanComplete = false;
  portsData: any[] = [];
  devicesData: any[] = [];
  portDevicesData = new Map();
  subscriptions: Subscription[] = [];
  SBI_PORTS = this.appConfigService.getConfig()['sbiPorts'].split(',');

  constructor(
    private dialogRef: MatDialogRef<ScanDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}

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
    await this.startScan();
  }

  async startScan() {
    this.scanComplete = false;
    await this.scanDevices();
    console.log(this.portDevicesData);
    localStorage.setItem('Sbi', '');
    this.scanComplete = true;
  }
  async scanDevices() {
    const requestBody = {
      type: appConstants.BIOMETRIC_DEVICE,
    };
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.SBI_PORTS.forEach((sbiPort: string) => {
          this.dataService
            .callSBIMethod(
              sbiPort,
              appConstants.SBI_METHOD_DEVICE,
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
                    const decodedData = this.getDecodedDeviceData(deviceData);
                    if (decodedData != null) {
                      decodedDataArr.push(decodedData);
                    }
                  });
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
            );
        })
      );
    });
  }

  getDeviceLabel(field: any) {
    if (field) {
      return `Device Id: ${field.deviceId}, Purpose: ${field.purpose}, Device Type: ${field.digitalIdDecoded.type}, Device Sub Type: ${field.digitalIdDecoded.deviceSubType}`;
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
      console.log(this.devicesData);
    } catch (error) {
      this.devicesData = [];
    }
  }
  getDecodedDeviceData(deviceData: any) {
    try {
      const digitalIdDecoded = JSON.parse(atob(deviceData.digitalId));
      const deviceDataNew: SbiDiscoverResponseModel = {
        deviceId: deviceData.deviceId,
        purpose: deviceData.purpose,
        deviceSubId: deviceData.deviceSubId,
        digitalId: deviceData.digitalId,
        digitalIdDecoded: digitalIdDecoded,
        deviceStatus: deviceData.deviceStatus,
        deviceCode: deviceData.deviceCode,
        error: deviceData.error,
        certification: deviceData.certification,
        specVersion: deviceData.specVersion,
        callbackId: deviceData.callbackId,
        serviceVersion: deviceData.serviceVersion,
      };
      return deviceDataNew;
    } catch (error) {
      return null;
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
      this.dialogRef.close();
    }
  }
}
