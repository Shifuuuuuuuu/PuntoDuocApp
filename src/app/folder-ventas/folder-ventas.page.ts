import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { QRScannerStatus,QRScanner } from '@ionic-native/qr-scanner/ngx';


@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  constructor(private router: Router,private qrScanner: QRScanner) {}

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['/ver-recompensas']);
  }

  async escanearQR() {
    const status: QRScannerStatus = await this.qrScanner.prepare();

    if (status.authorized) {
      // La cámara está lista para escanear
      const scanSub = this.qrScanner.scan().subscribe((text: string) => {
        console.log('Contenido del código QR: ', text);
        this.qrScanner.hide(); // Oculta la cámara
        scanSub.unsubscribe(); // Detiene la suscripción
      });

      this.qrScanner.show(); // Muestra la cámara
    } else if (status.denied) {
      console.error('La cámara fue denegada');
    } else {
      console.warn('La cámara no fue autorizada');
    }
  }
}
