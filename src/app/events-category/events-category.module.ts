import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventsCategoryPageRoutingModule } from './events-category-routing.module';

import { EventsCategoryPage } from './events-category.page';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventsCategoryPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [EventsCategoryPage]
})
export class EventsCategoryPageModule {}
