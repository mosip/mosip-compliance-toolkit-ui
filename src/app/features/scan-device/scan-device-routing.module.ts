import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanDeviceComponent } from './scan-device/scan-device.component';

const routes: Routes = [{ path: '', component: ScanDeviceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScanDeviceRoutingModule { }
