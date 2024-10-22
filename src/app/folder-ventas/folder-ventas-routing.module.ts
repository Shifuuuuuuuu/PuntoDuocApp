import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FolderVentasPage } from './folder-ventas.page';


const routes: Routes = [
  {
    path: '',
    component: FolderVentasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],

})
export class FolderVentasPageRoutingModule {}
