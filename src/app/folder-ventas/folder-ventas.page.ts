import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  constructor(private router: Router) {}

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['/ver-recompensas']);
  }

  async escanearQR() {
    await BarcodeScanner.checkPermission({ force: true });

    BarcodeScanner.hideBackground();

    const result = await BarcodeScanner.startScan();

    if (result.hasContent) {
      console.log(result.content);
    } else {
      console.error('No se encontró contenido en el código QR');
    }

    BarcodeScanner.showBackground();
    BarcodeScanner.stopScan();
  }
}