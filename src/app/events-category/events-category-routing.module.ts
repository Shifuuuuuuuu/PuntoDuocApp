import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventsCategoryPage } from './events-category.page';

const routes: Routes = [
  {
    path: '',
    component: EventsCategoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsCategoryPageRoutingModule {}
