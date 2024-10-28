import { CUSTOM_ELEMENTS_SCHEMA, NgModule,  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FolderPageRoutingModule } from './folder-routing.module';

import { FolderPage } from './folder.page';
import { TabUsuarioModule } from '../tab-usuario/tab-usuario.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FolderPageRoutingModule,
    TabUsuarioModule
  ],
  declarations: [FolderPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FolderPageModule {}
