import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddProjectComponent } from './add-project/add-project.component';
import { ViewProjectComponent } from './view-project/view-project.component';

const routes: Routes = [
  {
    path: 'add',
    pathMatch: 'full',
    component: AddProjectComponent,
    data: {
      breadcrumb: 'Add a new Project',
    },
  },
  {
    path: ':projectType/:projectId',
    children: [
      {
        path: '',
        component: ViewProjectComponent,
        data: {
          breadcrumb: {
            alias: 'projectBreadCrumb',
          },
        },
      },
      {
        path: 'collections',
        data: { breadcrumb: { label: 'Collections', disable: true } },
        loadChildren: () =>
          import('../collections/collections.module').then(
            (m) => m.CollectionsModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectRoutingModule {}
