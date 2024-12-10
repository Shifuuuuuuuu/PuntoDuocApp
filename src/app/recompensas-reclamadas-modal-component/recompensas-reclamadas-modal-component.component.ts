import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';

@Component({
  selector: 'app-recompensas-reclamadas-modal',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar style="background-color: black;">
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">
            <ion-icon style="color: #666;" name="close-circle-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title style="color: #666; font-weight: 600;">Recompensas Reclamadas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true" style="padding: 16px; background-color: #f9f9f9;">
      <ion-card *ngIf="recompensasReclamadas.length === 0" style="text-align: center; padding: 16px; border-radius: 8px;">
        <p>No hay recompensas reclamadas disponibles.</p>
      </ion-card>

      <ion-list *ngIf="recompensasReclamadas.length > 0">
        <ion-card *ngFor="let recompensa of recompensasReclamadas" style="margin-bottom: 16px; border-radius: 8px;">
          <ion-card-header>
            <ion-card-title style="font-weight: 600; color: black;">{{ recompensa.descripcion }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item *ngFor="let estudiante of recompensa.estudiantesReclamaron" style="--background: #ffffff; border-radius: 8px; margin-bottom: 8px;">
                <ion-label>{{ estudiante.Nombre_completo }}</ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `

      ion-card {
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class RecompensasReclamadasModalComponent {
  @Input() recompensasReclamadas: any[] = [];

  constructor(private modalController: ModalController, private firestore: AngularFirestore) {}

  async ngOnInit() {
    await this.cargarNombresEstudiantes();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  async cargarNombresEstudiantes() {
    this.recompensasReclamadas = await Promise.all(
      this.recompensasReclamadas.map(async (recompensa) => {
        if (recompensa.estudiantesReclamaron) {
          const estudiantesConNombres = await Promise.all(
            recompensa.estudiantesReclamaron.map(async (estudiante: { id_estudiante: string }) => {
              try {
                const estudianteDoc = await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).get().toPromise();
                const estudianteData = estudianteDoc?.data() as Estudiante | undefined; // Usar la interfaz aquí
                return {
                  ...estudiante,
                  Nombre_completo: estudianteData?.Nombre_completo || 'Nombre no disponible',
                };
              } catch (error) {
                console.error('Error cargando estudiante:', error);
                return { ...estudiante, Nombre_completo: 'Error al cargar' };
              }
            })
          );
          return { ...recompensa, estudiantesReclamaron: estudiantesConNombres };
        }
        return recompensa;
      })
    );
  }

}
