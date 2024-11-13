import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardVendedorPage } from './dashboard-vendedor.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardVendedorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardVendedorPageRoutingModule {}
