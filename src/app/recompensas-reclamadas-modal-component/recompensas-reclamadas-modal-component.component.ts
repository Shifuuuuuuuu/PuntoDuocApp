import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-recompensas-reclamadas-modal',
  template: `
    <ion-header [translucent]="true" class="custom-header">
      <ion-toolbar class="custom-toolbar" style="background-color: black;">
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">
            <ion-icon style="color: white" name="close-circle-outline"></ion-icon>
            <ion-label style="color: white; font-weight: bold;">Cerrar</ion-label>
          </ion-button>
        </ion-buttons>
        <ion-title style="color: white">Recompensas Reclamadas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="content-center">
      <ion-list>
        <ion-item *ngFor="let recompensa of recompensasReclamadas">
          <ion-label>{{ recompensa.descripcion }}</ion-label>
          <ion-badge slot="end">{{ recompensa.puntos_requeridos }} puntos</ion-badge>
          <ion-list class="inner-list">
            <ion-item *ngFor="let estudiante of recompensa.estudiantesReclamaron">
              <ion-label>ID Estudiante: {{ estudiante.id_estudiante }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-item>
      </ion-list>
    </ion-content>
    <style>
      .custom-header {
  position: relative;
  z-index: 10;
}

.custom-toolbar {
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  background-color: black;
  --background: transparent;
}

.custom-toolbar ion-title {
  font-size: 24px;
  font-weight: bold;
  color: white;
  text-align: center;
}

.custom-header::after {
  position: absolute;
  bottom: -30px;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: white;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
}

.content-center {
  --background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

ion-item {
  --background: white;
  color: black;
  border-radius: 8px;
  margin-bottom: 8px;
}

ion-badge {
  background-color: #0A49A7;
  color: white;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 12px;
}

.inner-list {
  padding-left: 16px; /* Añade un margen izquierdo a la lista interna */
}

.inner-list ion-item {
  --background: #f8f8f8;
  color: black;
  font-size: 14px;
  margin-top: 4px;
}
ion-list{
  background-color: white;
}
    </style>
  `
})
export class RecompensasReclamadasModalComponent {
  @Input() recompensasReclamadas: any[];

  constructor(private modalController: ModalController) {}

  closeModal() {
    this.modalController.dismiss();
  }
}
