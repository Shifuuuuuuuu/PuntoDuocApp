import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';


import { FolderVentasPage } from './folder-ventas.page';

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
    RouterModule.forChild(routes)
  ],
  declarations: [FolderVentasPage]
})
export class FolderVentasPageModule {}
