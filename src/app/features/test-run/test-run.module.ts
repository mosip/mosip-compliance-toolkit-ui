import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestRunRoutingModule } from './test-run-routing.module';
import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { TestRunComponent } from './test-run/test-run.component';


@NgModule({
  declarations: [
    TestRunComponent
  ],
  imports: [
    CommonModule,
    TestRunRoutingModule,
    BreadcrumbModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [BreadcrumbService]
})
export class TestRunModule { }
