import { Component, Inject, OnInit, Injectable } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as appConstants from 'src/app/app.constants';
import { DataService } from '../../../core/services/data-service';
import { AppConfigService } from '../../../app-config.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SbiDiscoverResponseModel } from 'src/app/core/models/sbi-discover';
import Utils from "src/app/app.utils";

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
    for (const sbiPort of this.SBI_PORTS) {
      await this.scanDevices(sbiPort);
    }
    if (this.portsData.length > 0) {
      localStorage.setItem(
        appConstants.SBI_SCAN_DATA,
        JSON.stringify([...this.portDevicesData])
      );
    }
    this.scanComplete = true;
  }

  async scanDevices(sbiPort: string) {
    const requestBody = {
      type: appConstants.BIOMETRIC_DEVICE,
    };
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
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
                  const decodedData = Utils.getDecodedDeviceData(deviceData);
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
}
