import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { CartService } from '../services/cart.service';
import { MenuController } from '@ionic/angular';

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
  usuarios: any[] = []; // Lista de usuarios inscritos
  listaEspera: any[] = [];
  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private menu: MenuController
  ) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }
  ngOnInit() {
    // Captura el ID del evento desde los parámetros de la URL
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventoId = id;
        console.log('Evento ID capturado en DetallesEventoPage:', this.eventoId);  // Verificación del ID del evento
        this.cargarListas(); // Llamar al método para cargar las listas de inscripciones y lista de espera
      } else {
        console.error('No se encontró el ID del evento.');
      }
    });
  }
  // Método para cargar la lista de inscripciones y lista de espera
  async cargarListas() {
    try {
      const { inscripciones, listaEspera } = await this.cartService.getDatosEvento(this.eventoId);
      this.usuarios = inscripciones;
      this.listaEspera = listaEspera;
      console.log('Usuarios inscritos:', this.usuarios);
      console.log('Lista de espera:', this.listaEspera);
    } catch (error) {
      console.error('Error al cargar las listas:', error);
    }
  }


  async verificarInscripcion() {
    this.escaneando = true; // Inicia el escaneo
    try {
      const qrData = await this.startScan(); // Inicia el escaneo
      console.log('Datos del QR escaneados:', qrData); // Verifica los datos obtenidos del QR
      console.log('ID del evento en verificación:', this.eventoId); // Verifica que el ID del evento sea correcto

      if (qrData) {

        // Verificación y actualización de inscripción
        const isVerified = await this.cartService.verifyAndUpdateInscription(qrData, this.eventoId);
        if (isVerified) {
          this.mensajePresencia = 'Inscripción verificada con éxito.';
        } else {
          this.mensajePresencia = 'No se encontró inscripción.';
          this.esVerificado = false;
        }
      }
    } catch (error) {
      this.mensajePresencia = 'Error al verificar inscripción. Intenta de nuevo.';
      this.esVerificado = false;
      console.error('Error durante la verificación de inscripción:', error);
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
      console.log('Datos QR escaneados correctamente:', parsedData); // Imprime los datos del QR

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
