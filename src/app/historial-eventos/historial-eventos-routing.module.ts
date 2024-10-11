import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialEventosPage } from './historial-eventos.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialEventosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialEventosPageRoutingModule {}
