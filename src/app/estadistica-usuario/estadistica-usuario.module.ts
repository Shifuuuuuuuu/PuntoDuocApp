import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EstadisticaUsuarioPageRoutingModule } from './estadistica-usuario-routing.module';

import { EstadisticaUsuarioPage } from './estadistica-usuario.page';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EstadisticaUsuarioPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [EstadisticaUsuarioPage]
})
export class EstadisticaUsuarioPageModule {}
