import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {VentasAuthService} from '../services/ventas.service'
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RecompensaService } from '../services/recompensa-service.service';
import { RecompensasModalComponent } from '../recompensas-modal-component/recompensas-modal-component.component';
import { RecompensasReclamadasModalComponent } from '../recompensas-reclamadas-modal-component/recompensas-reclamadas-modal-component.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Recompensa } from '../interface/IRecompensa';


RecompensasModalComponent
@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  errorMessage: string | undefined;
  recompensas: any[] = [];
  recompensasReclamadas: any[] = [];
  isLoadingRecompensas = true;
  isLoadingRecompensasReclamadas = true;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private ventasAuthService: VentasAuthService,
    private modalController: ModalController,
    private recompensaService: RecompensaService
  ) {}

  async ngOnInit() {
    await this.cargarRecompensas();
    await this.cargarRecompensasReclamadas();
  }

  // Cargar recompensas optimizadas
  async cargarRecompensas() {
    try {
      this.recompensas = await this.recompensaService.getRecompensas();
    } catch (error) {
      this.errorMessage = 'Hubo un problema al cargar las recompensas.';
    } finally {
      this.isLoadingRecompensas = false;
    }
  }

  // Cargar recompensas reclamadas optimizadas
  async cargarRecompensasReclamadas() {
    try {
      // Iterar y transformar las recompensas
      this.recompensasReclamadas = await Promise.all(
        this.recompensas
          .filter(r => Array.isArray(r.estudiantesReclamaron)) // Validar que `estudiantesReclamaron` sea un array
          .map(async r => {
            const estudiantesReclamados = await Promise.all(
              r.estudiantesReclamaron
                .filter((e: { reclamado: boolean; estado: string }) => e.reclamado && e.estado === 'activo') // Filtrar solo estudiantes activos
                .map(async (e: { id_estudiante: string }) => {
                  const estudianteDoc = await this.firestore.collection('Estudiantes').doc(e.id_estudiante).get().toPromise();

                  // Asegurarte de que existe el documento y usar un tipo explícito
                  if (estudianteDoc?.exists) {
                    const estudianteData = estudianteDoc.data() as { nombre_completo: string }; // Asegurarte de que el documento tiene el campo
                    return {
                      id_estudiante: e.id_estudiante,
                      nombre_completo: estudianteData.nombre_completo
                    };
                  } else {
                    return {
                      id_estudiante: e.id_estudiante,
                      nombre_completo: 'No encontrado' // Si no se encuentra el estudiante
                    };
                  }
                })
            );
            return { ...r, estudiantesReclamaron: estudiantesReclamados };
          })
      );
    } catch (error) {
      this.errorMessage = 'Hubo un problema al cargar las recompensas reclamadas.';
    } finally {
      this.isLoadingRecompensasReclamadas = false;
    }
  }


  async verRecompensas() {
    if (this.isLoadingRecompensas) return;
    const modal = await this.modalController.create({
      component: RecompensasModalComponent,
      componentProps: { recompensas: this.recompensas },
      cssClass: 'custom-modal'
    });
    await modal.present();
  }

  async verRecompensasReclamadas() {
    if (this.isLoadingRecompensasReclamadas) return;
    const modal = await this.modalController.create({
      component: RecompensasReclamadasModalComponent,
      componentProps: { recompensasReclamadas: await Promise.all(this.recompensasReclamadas) },
      cssClass: 'custom-modal'
    });
    await modal.present();
  }

  calcularFechaCaducidad(fechaReclamacion: string): string {
    const date = new Date(fechaReclamacion);
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verDashboard() {
    this.router.navigate(['/dashboard-vendedor']);
  }

  logoutt() {
    console.log('Cerrando sesión...');
    this.ventasAuthService.logout();
    this.router.navigate(['/iniciar-sesion']);
  }

  async startScan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17,
        cameraDirection: 1
      });

      const qrData = result.ScanResult;
      const qrDataObject = JSON.parse(qrData);

      await this.ventasAuthService.confirmarReclamacion(qrDataObject.id_recompensa, qrDataObject.id_estudiante);
    } catch (e) {
      console.error('Error al escanear el código:', e);
      throw e;
    }
  }
  gestionarRecompensas() {
    this.router.navigate(['/gestorrecompensaspage']);
  }
}
