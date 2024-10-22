import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PerfilGestorPageRoutingModule } from './perfil-gestor-routing.module';

import { PerfilGestorPage } from './perfil-gestor.page';
import { TabBarAdminModule } from '../tab-bar-admin/tab-bar-admin.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilGestorPageRoutingModule,
    TabBarAdminModule
  ],
  declarations: [PerfilGestorPage]
})
export class PerfilGestorPageModule {}
