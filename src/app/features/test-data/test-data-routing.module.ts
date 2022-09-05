import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddTestDataComponent } from './add-test-data/add-test-data.component';
import { ViewTestDataComponent } from './view-test-data/view-test-data.component';

const routes: Routes = [
  {
    path: 'add',
    data: { breadcrumb: 'Upload Biometrics Test Data' },
    component: AddTestDataComponent,
  },
  { path: ':testDataId', component: ViewTestDataComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestDataRoutingModule {}
