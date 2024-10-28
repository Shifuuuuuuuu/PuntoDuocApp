import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { VerRecompensasPageRoutingModule } from './ver-recompensas-routing.module';
import { VerRecompensasPage } from './ver-recompensas.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';
import { VerRecompensasComponent } from '../ver-recompensas/ver-recompensas.component';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerRecompensasPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [
    VerRecompensasPage,
    VerRecompensasComponent,
  ]
})
export class VerRecompensasPageModule {}
