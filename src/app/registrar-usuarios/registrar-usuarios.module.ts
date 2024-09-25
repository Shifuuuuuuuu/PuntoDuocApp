import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistrarUsuariosPageRoutingModule } from './registrar-usuarios-routing.module';

import { RegistrarUsuariosPage } from './registrar-usuarios.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrarUsuariosPageRoutingModule
  ],
  declarations: [RegistrarUsuariosPage]
})
export class RegistrarUsuariosPageModule {}
