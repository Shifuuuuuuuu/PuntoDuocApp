import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetallesEventoPageRoutingModule } from './detalles-evento-routing.module';

import { DetallesEventoPage } from './detalles-evento.page';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { TabBarAdminModule } from '../tab-bar-admin/tab-bar-admin.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetallesEventoPageRoutingModule,
    AngularFirestoreModule,
    TabBarAdminModule
  ],
  declarations: [DetallesEventoPage]
})
export class DetallesEventoPageModule {}
