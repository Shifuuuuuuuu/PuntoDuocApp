import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';


import { FolderVentasPage } from './folder-ventas.page';
import { TabBarModule } from '../tab-bar/tab-bar.module';
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes

const routes: Routes = [
  {
    path: '',
    component: FolderVentasPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
<<<<<<< Updated upstream
    TabBarModule,
=======
    TabBarModule
>>>>>>> Stashed changes
  ],
  declarations: [FolderVentasPage]
})
export class FolderVentasPageModule {}
