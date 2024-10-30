import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-recompensas-reclamadas-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Recompensas Reclamadas</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item *ngFor="let recompensa of recompensasReclamadas">
          <ion-label>{{ recompensa.descripcion }}</ion-label>
          <ion-badge slot="end">{{ recompensa.puntos_requeridos }} puntos</ion-badge>
          <ion-list>
            <ion-item *ngFor="let estudiante of recompensa.estudiantesReclamaron">
              <ion-label>ID Estudiante: {{ estudiante.id_estudiante }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class RecompensasReclamadasModalComponent {
  @Input() recompensasReclamadas: any[];

  constructor(private modalController: ModalController) {}

  closeModal() {
    this.modalController.dismiss();
  }
}
