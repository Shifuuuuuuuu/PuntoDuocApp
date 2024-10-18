import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VentasPage } from './folder-ventas.page';

const routes: Routes = [
  {
    path: '',
    component: VentasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FolderVentasPageRoutingModule {}
