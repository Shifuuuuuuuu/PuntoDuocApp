import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialEventosPageRoutingModule } from './historial-eventos-routing.module';

import { HistorialEventosPage } from './historial-eventos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialEventosPageRoutingModule
  ],
  declarations: [HistorialEventosPage]
})
export class HistorialEventosPageModule {}
