import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddProjectComponent } from './add-project/add-project.component';
import { ViewProjectComponent } from './view-project/view-project.component';

const routes: Routes = [
  {
    path: 'add',
    component: AddProjectComponent,
    data: {
      breadcrumb: "Add a new Project",
    },
  }, {
    path: ':projectType/:id',
    component: ViewProjectComponent,
    data: {
      breadcrumb: {
        alias: 'projectId',
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {}
