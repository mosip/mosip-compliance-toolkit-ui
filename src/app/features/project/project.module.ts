import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectRoutingModule } from './project-routing.module';
import { AddProjectComponent } from './add-project/add-project.component';
import { BreadcrumbModule, BreadcrumbService  } from 'xng-breadcrumb';
import { MaterialModule } from '../../core/material.module';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ViewProjectComponent } from './view-project/view-project.component';
import { I18nModule } from 'src/app/i18n.module';

@NgModule({
  declarations: [
    AddProjectComponent,
    ViewProjectComponent
  ],
  imports: [
    CommonModule,
    ProjectRoutingModule,
    BreadcrumbModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    I18nModule
  ],
  providers: [BreadcrumbService]
})
export class ProjectModule { }
