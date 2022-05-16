import { NgModule } from '@angular/core';

import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule
  ],
  exports: [
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule
  ]
})
export class MaterialModule { }
