import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GestorrecompensaspagePageRoutingModule } from './gestorrecompensaspage-routing.module';

import { GestorrecompensaspagePage } from './gestorrecompensaspage.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GestorrecompensaspagePageRoutingModule,
    TabBarModule
  ],
  declarations: [GestorrecompensaspagePage]
})
export class GestorrecompensaspagePageModule {}
