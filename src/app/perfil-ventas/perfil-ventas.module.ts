import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PerfilVentasPageRoutingModule } from './perfil-ventas-routing.module';

import { PerfilVentasPage } from './perfil-ventas.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilVentasPageRoutingModule,
    TabBarModule
  ],
  declarations: [PerfilVentasPage]
})
export class PerfilVentasPageModule {}
