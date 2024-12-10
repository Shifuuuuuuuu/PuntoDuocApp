import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GestorrecompensaspagePage } from './gestorrecompensaspage.page';

const routes: Routes = [
  {
    path: '',
    component: GestorrecompensaspagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestorrecompensaspagePageRoutingModule {}
