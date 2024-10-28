import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {VentasAuthService} from '../services/ventas.service'
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';


@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  errorMessage: string | undefined;


  constructor(private router: Router, private ventasAuthService: VentasAuthService) {}

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['/ver-recompensas']);
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
