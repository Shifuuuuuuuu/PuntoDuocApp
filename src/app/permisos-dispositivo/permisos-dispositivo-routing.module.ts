import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PermisosDispositivoPage } from './permisos-dispositivo.page';

const routes: Routes = [
  {
    path: '',
    component: PermisosDispositivoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PermisosDispositivoPageRoutingModule {}
