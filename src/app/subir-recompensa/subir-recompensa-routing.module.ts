import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubirRecompensaPage } from './subir-recompensa.page';

const routes: Routes = [
  {
    path: '',
    component: SubirRecompensaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubirRecompensaPageRoutingModule {}
