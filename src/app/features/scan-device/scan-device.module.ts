import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbModule, BreadcrumbService } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ScanDeviceRoutingModule } from './scan-device-routing.module';
import { ScanDeviceComponent } from './scan-device/scan-device.component';

@NgModule({
  declarations: [ScanDeviceComponent],
  imports: [
    CommonModule,
    ScanDeviceRoutingModule,
    MaterialModule,
    FormsModule,
    BreadcrumbModule,
    ReactiveFormsModule,
  ],
  providers: [BreadcrumbService],
})
export class ScanDeviceModule {}
