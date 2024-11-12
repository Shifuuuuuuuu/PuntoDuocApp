import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PerfilVentasPage } from './perfil-ventas.page';

const routes: Routes = [
  {
    path: '',
    component: PerfilVentasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilVentasPageRoutingModule {}
