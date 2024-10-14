import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderGestorEventosPageRoutingModule } from './folder-gestor-eventos-routing.module';

import { FolderGestorEventosPage } from './folder-gestor-eventos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FolderGestorEventosPageRoutingModule
  ],
  declarations: [FolderGestorEventosPage]
})
export class FolderGestorEventosPageModule {}
