import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanDeviceComponent } from './scan-device/scan-device.component';
import { ExecuteTestRunComponent } from './execute-test-run/execute-test-run.component';

const routes: Routes = [
  { path: 'execute', component: ExecuteTestRunComponent, data: { breadcrumb: 'Execute Test Run' },},
  {
    path: 'scan/device',
    data: { breadcrumb: 'Scan Device' },
    component: ScanDeviceComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestRunRoutingModule {}
