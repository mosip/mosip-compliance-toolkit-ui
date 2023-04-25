import { NgModule } from '@angular/core';

import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {ClipboardModule} from '@angular/cdk/clipboard';
import { I18nModule } from '../i18n.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressBarModule,
    ClipboardModule
  ],
  exports: [
    MatSliderModule,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatProgressBarModule,
    ClipboardModule,
    I18nModule
  ],
})
export class MaterialModule {}
