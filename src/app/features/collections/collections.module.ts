import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectionsRoutingModule } from './collections-routing.module';
import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { I18nModule } from 'src/app/i18n.module';

import { AddCollectionsComponent } from './add-collections/add-collections.component';
import { ViewCollectionsComponent } from './view-collections/view-collections.component';


@NgModule({
  declarations: [
    AddCollectionsComponent,
    ViewCollectionsComponent
  ],
  imports: [
    CommonModule,
    CollectionsRoutingModule,
    BreadcrumbModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    I18nModule
  ],
  providers: [BreadcrumbService]
})
export class CollectionsModule { }
