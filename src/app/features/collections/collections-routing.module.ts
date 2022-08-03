import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCollectionsComponent } from './add-collections/add-collections.component';
import { ViewCollectionsComponent } from './view-collections/view-collections.component';

const routes: Routes = [
  {
    path: 'add',
    data: {
      breadcrumb: {
        alias: 'collectionBreadCrumb',
      },
    },
    component: AddCollectionsComponent,
  },
  {
    path: ':collectionId',
    children: [
      {
        path: '',
        data: {
          breadcrumb: {
            alias: 'collectionBreadCrumb',
          },
        },
        component: ViewCollectionsComponent,
      },
      {
        path: 'testrun',
        data: { breadcrumb: { label: 'Test Run', skip: true } },
        loadChildren: () =>
          import('../../features/test-run/test-run.module').then(
            (m) => m.TestRunModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionsRoutingModule {}
