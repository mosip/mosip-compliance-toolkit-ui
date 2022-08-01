import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCollectionsComponent } from './add-collections/add-collections.component';
import { ViewcollectionsComponent } from './viewcollections/viewcollections.component';

const routes: Routes = [
  {
    path: 'add',
    data: {
      breadcrumb: {
        alias: 'collectionData',
      },
    },
    component: AddCollectionsComponent,
  },
  {
    path: ':projectType/:id',
    component: ViewcollectionsComponent,
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
export class CollectionsRoutingModule {}
