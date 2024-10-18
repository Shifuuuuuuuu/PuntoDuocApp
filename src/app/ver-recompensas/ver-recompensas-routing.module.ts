import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VerRecompensasPage } from './ver-recompensas.page';

const routes: Routes = [
  {
    path: '',
    component: VerRecompensasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VerRecompensasPageRoutingModule {}
