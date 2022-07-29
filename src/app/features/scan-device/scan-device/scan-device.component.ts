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
  availableSbiPorts: any[] = [];
  availableSbiDevices: any[] = [];
  subscriptions: Subscription[] = [];
  SBI_PORTS = this.appConfigService.getConfig()['sbiPorts'].split(',');

  constructor(
    private dialogRef: MatDialogRef<ScanDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataService: DataService,
    private appConfigService: AppConfigService
  ) {}
  public closeMe() {
    localStorage.setItem(appConstants.SCAN_SBI_DEVICE_COMPLETE, 'true');
    this.dialogRef.close();
  }
  async ngOnInit() {
    this.scanForm.addControl('availablePort', new FormControl(''));
    this.scanForm.addControl('availableDevices', new FormControl(''));
    this.input = this.data;
    await this.scanDevices();
    this.scanComplete = true;
    // localStorage.setItem("availableSbiPort", sbiPort);
    // localStorage.setItem("availableDeviceInfo", JSON.stringify(response));
  }

  async scanDevices() {
    const requestBody = {
      type: 'Biometric Device',
    };
    console.log(this.SBI_PORTS);
    return new Promise((resolve, reject) => {
      this.subscriptions.push(
        this.SBI_PORTS.forEach((sbiPort: string) => {
          this.dataService
            .callSBIMethod(sbiPort, 'device', 'MOSIPDISC', requestBody)
            .subscribe(
              (response) => {
                console.log(response);
                if (response) {
                  this.availableSbiPorts.push(sbiPort);
                  this.availableSbiDevices.push(JSON.stringify(response));
                  resolve(true);
                }
              },
              (error) => {}
            );
        })
        
      );
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
