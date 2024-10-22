import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PerfilGestorPage } from './perfil-gestor.page';

const routes: Routes = [
  {
    path: '',
    component: PerfilGestorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilGestorPageRoutingModule {}
