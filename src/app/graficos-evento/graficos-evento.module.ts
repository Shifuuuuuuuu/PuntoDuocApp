import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GraficosEventoPageRoutingModule } from './graficos-evento-routing.module';

import { GraficosEventoPage } from './graficos-evento.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GraficosEventoPageRoutingModule
  ],
  declarations: [GraficosEventoPage]
})
export class GraficosEventoPageModule {}
