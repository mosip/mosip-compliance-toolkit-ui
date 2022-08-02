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
    data: {
      breadcrumb: {
        alias: 'collectionBreadCrumb',
      },
    },
    component: ViewCollectionsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionsRoutingModule {}
