import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-recompensas-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Recompensas Disponibles</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item *ngFor="let recompensa of recompensas">
          <ion-label>{{ recompensa.descripcion }}</ion-label>
          <ion-badge slot="end">{{ recompensa.puntos_requeridos }} puntos</ion-badge>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class RecompensasModalComponent {
  @Input() recompensas: any[];

  constructor(private modalController: ModalController) {}

  closeModal() {
    this.modalController.dismiss();
  }
}
