import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardVendedorPageRoutingModule } from './dashboard-vendedor-routing.module';

import { DashboardVendedorPage } from './dashboard-vendedor.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardVendedorPageRoutingModule,TabBarModule
  ],
  declarations: [DashboardVendedorPage]
})
export class DashboardVendedorPageModule {}
