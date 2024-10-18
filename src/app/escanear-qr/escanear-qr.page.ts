import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

@Component({
  selector: 'app-escanear-qr',
  templateUrl: './escanear-qr.page.html',
  styleUrls: ['./escanear-qr.page.scss'],
})
export class EscanearQrPage {
  constructor() {}

  async escanearQR() {
    const status = await BarcodeScanner.checkPermission({ force: true });

    if (status.granted) {
      BarcodeScanner.hideBackground(); // para hacer la página transparente

      const result = await BarcodeScanner.startScan(); // Iniciar escaneo

      if (result.hasContent) {
        console.log(result.content); // Aquí puedes manejar el contenido del QR
      } else {
        console.error('No se encontró contenido en el código QR');
      }

      BarcodeScanner.showBackground(); // mostrar la página nuevamente
      BarcodeScanner.stopScan(); // detener el escaneo
    } else {
      console.error('Permiso de cámara no concedido');
    }
  }
}