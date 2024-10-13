import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EstadisticaUsuarioPage } from './estadistica-usuario.page';

const routes: Routes = [
  {
    path: '',
    component: EstadisticaUsuarioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EstadisticaUsuarioPageRoutingModule {}
