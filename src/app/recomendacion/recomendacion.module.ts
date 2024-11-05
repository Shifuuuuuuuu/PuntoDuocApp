import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecomendacionPageRoutingModule } from './recomendacion-routing.module';

import { RecomendacionPage } from './recomendacion.page';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecomendacionPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [RecomendacionPage]
})
export class RecomendacionPageModule {}
