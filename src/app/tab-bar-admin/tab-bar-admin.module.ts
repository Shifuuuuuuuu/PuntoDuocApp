import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular';
import { TabBarAdminComponent } from './tab-bar-admin.component';
;@NgModule({
  declarations: [TabBarAdminComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [TabBarAdminComponent]
})
export class TabBarAdminModule { }
