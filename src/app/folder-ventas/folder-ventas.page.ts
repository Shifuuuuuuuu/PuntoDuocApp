import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {VentasAuthService} from '../services/ventas.service'
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RecompensaService } from '../services/recompensa-service.service';
import { RecompensasModalComponent } from '../recompensas-modal-component/recompensas-modal-component.component';
import { RecompensasReclamadasModalComponent } from '../recompensas-reclamadas-modal-component/recompensas-reclamadas-modal-component.component';


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


  constructor(private router: Router, private ventasAuthService: VentasAuthService,private modalController: ModalController, private recompensaService: RecompensaService) {}

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
      }
    });
    return await modal.present();
  }
  async verRecompensasReclamadas() {
    const modal = await this.modalController.create({
      component: RecompensasReclamadasModalComponent,
      componentProps: {
        recompensasReclamadas: this.recompensasReclamadas
      }
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
