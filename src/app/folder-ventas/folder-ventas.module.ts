import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderVentasPageRoutingModule } from './folder-ventas-routing.module';

import { FolderVentasPage } from './folder-ventas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FolderVentasPageRoutingModule
  ],
  declarations: [FolderVentasPage]
})
export class FolderVentasPageModule {}
