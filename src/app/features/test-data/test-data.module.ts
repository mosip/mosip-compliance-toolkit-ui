import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { TestDataRoutingModule } from './test-data-routing.module';
import { AddTestDataComponent } from './add-test-data/add-test-data.component';
import { ViewTestDataComponent } from './view-test-data/view-test-data.component';


@NgModule({
  declarations: [
    AddTestDataComponent,
    ViewTestDataComponent
  ],
  imports: [
    CommonModule,
    TestDataRoutingModule,
    BreadcrumbModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [BreadcrumbService]
})
export class TestDataModule { }
