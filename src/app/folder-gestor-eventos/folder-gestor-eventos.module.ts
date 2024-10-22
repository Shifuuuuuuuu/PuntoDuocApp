import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderGestorEventosPageRoutingModule } from './folder-gestor-eventos-routing.module';

import { FolderGestorEventosPage } from './folder-gestor-eventos.page';
import { TabBarAdminModule } from '../tab-bar-admin/tab-bar-admin.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FolderGestorEventosPageRoutingModule,
    TabBarAdminModule
  ],
  declarations: [FolderGestorEventosPage]
})
export class FolderGestorEventosPageModule {}
