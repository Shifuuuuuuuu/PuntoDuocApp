import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubirRecompensaPageRoutingModule } from './subir-recompensa-routing.module';

import { SubirRecompensaPage } from './subir-recompensa.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubirRecompensaPageRoutingModule
  ],
  declarations: [SubirRecompensaPage]
})
export class SubirRecompensaPageModule {}
