import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PermisosDispositivoPageRoutingModule } from './permisos-dispositivo-routing.module';

import { PermisosDispositivoPage } from './permisos-dispositivo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PermisosDispositivoPageRoutingModule
  ],
  declarations: [PermisosDispositivoPage]
})
export class PermisosDispositivoPageModule {}
