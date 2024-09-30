import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistrarInvitadoPageRoutingModule } from './registrar-invitado-routing.module';

import { RegistrarInvitadoPage } from './registrar-invitado.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistrarInvitadoPageRoutingModule
  ],
  declarations: [RegistrarInvitadoPage]
})
export class RegistrarInvitadoPageModule {}
