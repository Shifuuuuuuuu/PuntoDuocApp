import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AccesibilidadPageRoutingModule } from './accesibilidad-routing.module';

import { AccesibilidadPage } from './accesibilidad.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AccesibilidadPageRoutingModule
  ],
  declarations: [AccesibilidadPage]
})
export class AccesibilidadPageModule {}
