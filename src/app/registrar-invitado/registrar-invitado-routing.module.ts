import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistrarInvitadoPage } from './registrar-invitado.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrarInvitadoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrarInvitadoPageRoutingModule {}
