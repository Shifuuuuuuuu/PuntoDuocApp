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
import { Estudiante } from '../interface/IEstudiante';

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



  constructor(private firestore: AngularFirestore,private router: Router, private ventasAuthService: VentasAuthService,private modalController: ModalController, private recompensaService: RecompensaService) {}

  async ngOnInit() {
    this.recompensas = await this.recompensaService.getRecompensas();
    this.recompensasReclamadas = this.recompensas
      .filter(r => Array.isArray(r.estudiantesReclamaron))
      .map(r => ({
        ...r,
        estudiantesReclamaron: r.estudiantesReclamaron.filter((e: { reclamado: boolean; }) => e.reclamado === true)
      }))
      .filter(r => r.estudiantesReclamaron.length > 0);
  }

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  async verRecompensas() {
    const modal = await this.modalController.create({
      component: RecompensasModalComponent,
      componentProps: {
        recompensas: this.recompensas
      },
      cssClass: 'custom-modal' // Añadir esta línea para aplicar la clase CSS del modal
    });
    return await modal.present();
  }
  
  async verRecompensasReclamadas() {
    // Obtener recompensas con nombres de estudiantes
    const recompensasConNombres: Recompensa[] = await Promise.all(
      this.recompensasReclamadas.map(async (recompensa) => {
        // Mapear estudiantes y obtener sus nombres
        const estudiantesConNombres = await Promise.all(
          recompensa.estudiantesReclamaron.map(async (estudiante: { id_estudiante: string | undefined; }) => {
            const estudianteDoc = await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).get().toPromise();
  
            
            // Verificar si el documento existe y obtener el nombre
            if (estudianteDoc && estudianteDoc.exists) {
              const estudianteData = estudianteDoc.data() as { nombre_completo: string }; // Usar tipo anónimo aquí
              
              return {
                id_estudiante: estudiante.id_estudiante,
                nombre_completo: estudianteData.nombre_completo,
                
              };
            } else {
              return {
                id_estudiante: estudiante.id_estudiante,
                nombre_completo: 'No encontrado', // Valor predeterminado si no se encuentra
              };
              
            }
          })
        );
  
        return {
          ...recompensa,
          estudiantesReclamaron: estudiantesConNombres, // Mantener el array de estudiantes con sus nombres
        };
      })
    );
  
    // Crear el modal y pasar las recompensas con los nombres de estudiantes
    const modal = await this.modalController.create({
      component: RecompensasReclamadasModalComponent,
      componentProps: {
        recompensasReclamadas: recompensasConNombres, // Asegúrate de que esto es un array de recompensas
      },
      cssClass: 'custom-modal', // Asegúrate de que esto ajuste la altura
    });
    return await modal.present();
  }
  
  
  
  
  




  logoutt() {
    console.log('Cerrando sesión...');
    this.ventasAuthService.logout();
    this.router.navigate(['/iniciar-sesion']); // Redirigir a la página de inicio de sesión
  }
  async startScan() {
    try {
        const result = await CapacitorBarcodeScanner.scanBarcode({
            hint: 17,
            cameraDirection: 1,
        });

        const qrData = result.ScanResult; // Obtener la información del QR

        // Suponiendo que el QR contiene un JSON con los datos necesarios
        const qrDataObject = JSON.parse(qrData); // Analiza el JSON

        // Llama a confirmarReclamacion con los datos extraídos
        await this.ventasAuthService.confirmarReclamacion(
            qrDataObject.id_recompensa,
            qrDataObject.id_estudiante
        );
        return

    } catch (e) {
        console.error('Error al escanear el código:', e);
        throw e;
    }
    
}

}
