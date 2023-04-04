import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { TestDataRoutingModule } from './test-data-routing.module';
import { AddTestDataComponent } from './add-test-data/add-test-data.component';
import { ViewTestDataComponent } from './view-test-data/view-test-data.component';
import { I18nModule } from 'src/app/i18n.module';


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
    I18nModule
  ],
  providers: [BreadcrumbService]
})
export class TestDataModule { }
