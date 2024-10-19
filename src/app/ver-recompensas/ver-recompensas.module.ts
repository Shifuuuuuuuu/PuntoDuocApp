import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerRecompensasPageRoutingModule } from './ver-recompensas-routing.module';

import { VerRecompensasPage } from './ver-recompensas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerRecompensasPageRoutingModule
  ],
  declarations: [VerRecompensasPage]
})
export class VerRecompensasPageModule {}