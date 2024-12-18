import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { SubirRecompensaPageRoutingModule } from './subir-recompensa-routing.module'; // Asegúrate de importar el módulo de routing
import { SubirRecompensaPage } from './subir-recompensa.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SubirRecompensaPageRoutingModule,
    TabBarModule
  ],
  declarations: [SubirRecompensaPage],
})
export class SubirRecompensaPageModule {}
