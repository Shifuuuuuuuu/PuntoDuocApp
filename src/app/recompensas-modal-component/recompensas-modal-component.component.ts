import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-recompensas-modal',
  template: `
    <ion-header>
      <ion-toolbar style="background-color: black;">
        <ion-title style="color: #666; font-size: 1.5rem; font-weight: 600;">Recompensas Disponibles</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">
            <ion-icon style="color: #666; font-size: 1.5rem;" name="close-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" style="background-color: #f9f9f9; padding: 16px;">
      <ion-list *ngIf="recompensas && recompensas.length > 0; else noRecompensas">
        <ion-item *ngFor="let recompensa of recompensas" style="--background: white; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <ion-label style="font-size: 1rem; font-weight: 500; color: #333;">{{ recompensa.descripcion }}</ion-label>
          <ion-badge slot="end" style="background-color: #0A49A7; color: white; font-weight: bold; font-size: 0.9rem; padding: 6px 12px; border-radius: 12px;">
            {{ recompensa.puntos_requeridos }} puntos
          </ion-badge>
        </ion-item>
      </ion-list>

      <ng-template #noRecompensas>
        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 1.2rem; color: #666;">No hay recompensas disponibles.</p>
        </div>
      </ng-template>
    </ion-content>
  `,
})
export class RecompensasModalComponent implements OnInit {
  @Input() recompensas: any[] = [];

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    // Optimización para cargar los datos más rápido
    if (!this.recompensas) {
      this.recompensas = []; // Asegura que no haya retraso en la inicialización
    }
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
