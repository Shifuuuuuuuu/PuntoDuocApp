import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular';
import { TabUsuarioComponent } from './tab-usuario.component';
;@NgModule({
  declarations: [TabUsuarioComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [TabUsuarioComponent]
})
export class TabUsuarioModule { }
