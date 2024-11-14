import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-recompensas-reclamadas-modal',
  template: `
    <ion-header [translucent]="true" class="custom-header">
      <ion-toolbar class="custom-toolbar" style="background-color: black;">
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">
            <ion-icon style="color: white" name="close-circle-outline"></ion-icon>
            <ion-label style="color: white; font-weight: bold;"></ion-label>
          </ion-button>
        </ion-buttons>
        <ion-title style="color: white">Reclamadas</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="content-center">
      <ion-list>
        <ion-item *ngFor="let recompensa of recompensasReclamadas">
          <ion-label>{{ recompensa.descripcion }}</ion-label>
          <ion-list>
            <ion-item *ngFor="let estudiante of recompensa.estudiantesReclamaron || []">
              <ion-label>{{ estudiante.Nombre_completo }}</ion-label>
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
        padding: 16px; /* Añadir padding para mejorar el aspecto visual */
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

      ion-list {
        background-color: white;
        --padding-start: 0; /* Quitar el padding a la izquierda */
      }

      /* Ajustes para el modal */
      .custom-modal {
        --width: 90%; /* Mantener ancho al 90% */
        --max-width: 600px; /* Máximo ancho del modal */
        --max-height: 80%; /* Máxima altura del modal */
        --border-radius: 16px;
        --background: white;
        margin: auto; /* Centrar el modal */
      }

      ion-content {
        max-height: 80vh; /* Máxima altura del contenido */
        overflow-y: auto; /* Hacer scroll si el contenido excede la altura */
      }
    </style>
  `
})
export class RecompensasReclamadasModalComponent {
  @Input() recompensasReclamadas: any[];

  constructor(private modalController: ModalController, private firestore: AngularFirestore) {}

  closeModal() {
    this.modalController.dismiss();
  }

  async ngOnInit() {
    // Cargar nombres de estudiantes
    await this.cargarNombresEstudiantes();
  }

  async cargarNombresEstudiantes() {
    for (const recompensa of this.recompensasReclamadas) {
      if (recompensa.estudiantesReclamaron) {
        for (const estudiante of recompensa.estudiantesReclamaron) {
          // Consultar en la colección Estudiantes por el id_estudiante
          const estudianteDoc = await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).get().toPromise();

          // Verificar que el documento existe
          if (estudianteDoc && estudianteDoc.exists) {
            const estudianteData = estudianteDoc.data() as any; // Usar 'any' para evitar errores de tipo
            // Asignar el nombre completo al objeto del estudiante
            estudiante.Nombre_completo = estudianteData?.Nombre_completo || 'Nombre no disponible'; // Manejo de nombre no disponible
          } else {
            console.warn(`No se encontró el estudiante con ID: ${estudiante.id_estudiante}`);
            estudiante.Nombre_completo = 'Nombre no encontrado'; // Manejar el caso cuando no se encuentra el estudiante
          }
        }
      }
    }
  }
}
