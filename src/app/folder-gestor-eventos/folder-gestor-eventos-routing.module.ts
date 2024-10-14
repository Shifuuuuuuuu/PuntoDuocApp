import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FolderGestorEventosPage } from './folder-gestor-eventos.page';

const routes: Routes = [
  {
    path: '',
    component: FolderGestorEventosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FolderGestorEventosPageRoutingModule {}
