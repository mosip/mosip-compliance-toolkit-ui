import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanDeviceComponent } from './scan-device/scan-device.component';
import { ExecuteTestRunComponent } from './execute-test-run/execute-test-run.component';
import { TestRunComponent } from './test-run/test-run.component';
import { TestRunHistoryComponent } from './test-run-history/test-run-history.component';

const routes: Routes = [
  {
    path: 'execute',
    component: ExecuteTestRunComponent,
    data: { breadcrumb: 'Execute Test Run' },
  },
  {
    path: 'scan/device',
    data: { breadcrumb: 'Scan Device' },
    component: ScanDeviceComponent,
  },
  {
    path: ':runId',
    data: {
      breadcrumb: {
        alias: 'testrunBreadCrumb',
      },
    },
    component: TestRunComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestRunRoutingModule {}
