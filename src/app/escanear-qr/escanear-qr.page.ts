import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';

@Component({
  selector: 'app-escanear-qr',
  templateUrl: './escanear-qr.page.html',
  styleUrls: ['./escanear-qr.page.scss'],
})
export class EscanearQrPage implements OnInit {

  scannedData: string | undefined;

  constructor(private qrScanner: QRScanner, private platform: Platform) {
    this.platform.ready().then(() => {
      this.qrScanner.prepare()
        .then((status: QRScannerStatus) => {
          if (status.authorized) {
            // Start scanning
            let scanSub = this.qrScanner.scan().subscribe((text: string) => {
              this.scannedData = text;
              this.qrScanner.hide(); // Hide camera preview
              scanSub.unsubscribe(); // Stop scanning
            });

            // Show camera preview
            this.qrScanner.show();
          } else if (status.denied) {
            console.error('Camera permission denied');
            // Handle permission denial
          } else {
            console.error('Permission denied for this runtime');
            // Handle other types of permission denial
          }
        })
        .catch((e: any) => console.log('Error is', e));
    });
  }

  ngOnInit() { }

}
