import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccesibilidadPage } from './accesibilidad.page';

const routes: Routes = [
  {
    path: '',
    component: AccesibilidadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccesibilidadPageRoutingModule {}
