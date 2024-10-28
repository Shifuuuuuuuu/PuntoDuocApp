import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialEventosPageRoutingModule } from './historial-eventos-routing.module';

import { HistorialEventosPage } from './historial-eventos.page';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialEventosPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [HistorialEventosPage]
})
export class HistorialEventosPageModule {}
