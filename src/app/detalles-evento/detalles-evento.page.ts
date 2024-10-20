import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-detalles-evento',
  templateUrl: './detalles-evento.page.html',
  styleUrls: ['./detalles-evento.page.scss'],
})
export class DetallesEventoPage implements OnInit {
  eventoId: string = ''; // ID del evento
  mensajePresencia: string = ''; // Mensaje de presencia
  esVerificado: boolean = false; // Indicador de verificación
  escaneando: boolean = false; // Estado para mostrar si está escaneando

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService // Inyectar CartService
  ) {}

  ngOnInit() {
    // Captura el ID del evento desde los parámetros de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventoId = id;
        console.log('Evento ID:', this.eventoId);  // Verifica que el ID del evento se recibe
      } else {
        console.error('No se encontró el ID del evento.');
      }
    });
  }

  async verificarInscripcion() {
    this.escaneando = true; // Inicia el escaneo
    try {
      const qrData = await this.startScan(); // Inicia el escaneo
      console.log('QR Data:', qrData); // Verifica que el QR tenga los datos correctos
      console.log('ID del evento:', this.eventoId); // Verifica que el ID del evento sea correcto

      if (qrData) {
        // Aquí debes pasar el ID del evento que obtuviste al inicializar el componente
        const isVerified = await this.cartService.verifyAndUpdateInscription(qrData, this.eventoId);
        if (isVerified) {
          this.mensajePresencia = 'Inscripción verificada con éxito.';
          this.esVerificado = true;
        } else {
          this.mensajePresencia = 'No se encontró inscripción.';
          this.esVerificado = false;
        }
      }
    } catch (error) {
      this.mensajePresencia = 'Error al verificar inscripción. Intenta de nuevo.';
      this.esVerificado = false;
      console.error(error);
    } finally {
      this.escaneando = false; // Termina el escaneo
    }
  }


  async startScan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17,
        cameraDirection: 1,
      });

      const qrData = result.ScanResult; // Aquí obtienes la información del QR (ID y otros datos)
      const parsedData = JSON.parse(qrData); // Verifica que el QR tiene datos válidos
      console.log('Datos QR escaneados:', parsedData); // Imprime los datos del QR

      // Verifica que los datos tengan las propiedades necesarias
      if ((parsedData.id_estudiante || parsedData.id_Invitado) && parsedData.Nombre_completo) {
        return parsedData; // Suponiendo que el QR tiene los datos en formato JSON
      } else {
        console.error('Los datos del QR no son válidos:', parsedData);
        throw new Error('Los datos del QR no son válidos');
      }
    } catch (e) {
      console.error('Error al escanear el código:', e);
      throw e;
    }
  }
}
