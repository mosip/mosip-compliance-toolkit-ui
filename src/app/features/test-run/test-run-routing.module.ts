import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestRunComponent } from './test-run/test-run.component';

const routes: Routes = [{ path: '', component: TestRunComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestRunRoutingModule { }
