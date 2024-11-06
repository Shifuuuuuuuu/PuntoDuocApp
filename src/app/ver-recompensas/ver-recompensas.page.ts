import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-ver-recompensas-page',
  templateUrl: './ver-recompensas.page.html',
  styleUrls: ['./ver-recompensas.page.scss'],
})
export class VerRecompensasPage {
  constructor(
  private menu: MenuController
  ) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }


}
