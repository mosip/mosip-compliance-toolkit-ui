import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { MainAppComponent } from './main-app.component';
import { MainAppRoutingModule } from './main-app-routing.module';
import { environment } from 'src/environments/environment';

let imports = [
  MainAppRoutingModule
]

if (environment.isAndroidAppMode != 'yes') {
  imports.push(CoreModule);
}

@NgModule({
  declarations: [MainAppComponent],
  imports: [
    MainAppRoutingModule,
    CoreModule,
  ],
  bootstrap: [MainAppComponent],
})
export class MainAppModule { }
