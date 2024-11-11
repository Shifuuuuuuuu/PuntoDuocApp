import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GraficosEventoPage } from './graficos-evento.page';

const routes: Routes = [
  {
    path: '',
    component: GraficosEventoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GraficosEventoPageRoutingModule {}
