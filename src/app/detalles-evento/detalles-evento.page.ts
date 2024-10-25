import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { CartService } from '../services/cart.service';
import { AlertController, MenuController } from '@ionic/angular';
import { Evento } from '../interface/IEventos';

@Component({
  selector: 'app-detalles-evento',
  templateUrl: './detalles-evento.page.html',
  styleUrls: ['./detalles-evento.page.scss'],
})
export class DetallesEventoPage implements OnInit {
  eventoId: string = '';
  mensajePresencia: string = '';
  esVerificado: boolean = false;
  escaneando: boolean = false;
  usuarios: any[] = [];
  listaEspera: any[] = [];
  evento: Evento | undefined;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private menu: MenuController,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventoId = id;
        this.cargarEvento();
        this.cargarListas();
      } else {
        console.error('No se encontró el ID del evento.');
      }
    });
  }

  async cargarEvento() {
    try {
      this.evento = await this.cartService.getEvento(this.eventoId);
    } catch (error) {
      console.error('Error al cargar el evento:', error);
    }
  }

  async cargarListas() {
    try {
      const { inscripciones, listaEspera } = await this.cartService.getDatosEvento(this.eventoId);
      this.usuarios = inscripciones;
      this.listaEspera = listaEspera;
    } catch (error) {
      console.error('Error al cargar las listas:', error);
    }
  }

  async verificarInscripcion() {
    this.escaneando = true;
    try {
      const qrData = await this.startScan();

      if (qrData) {
        const inscripcion = await this.cartService.getInscripcionVerificada(qrData, this.eventoId);

        if (inscripcion && inscripcion.verificado) {
          this.mensajePresencia = 'Este usuario ya ha sido acreditado.';
          await this.presentAlertAcreditacion(qrData.Nombre_completo, this.evento?.titulo || 'Evento', 0, 'yaAcreditado');
          return;
        }

        const result = await this.cartService.verifyAndUpdateInscription(qrData, this.eventoId);
        this.esVerificado = result.verificado;
        this.mensajePresencia = this.esVerificado ? 'Inscripción verificada con éxito.' : 'No se encontró inscripción.';
        await this.presentAlertAcreditacion(qrData.Nombre_completo, this.evento?.titulo || 'Evento', result.puntaje || 200, this.esVerificado ? 'acreditado' : 'noInscrito');
      }
    } catch (error) {
      this.mensajePresencia = 'Error al verificar inscripción. Intenta de nuevo.';
      this.esVerificado = false;
      console.error('Error durante la verificación de inscripción:', error);
    } finally {
      this.escaneando = false;
    }
  }

  async presentAlertAcreditacion(nombreUsuario: string, nombreEvento: string, puntos: number, estado: 'yaAcreditado' | 'acreditado' | 'noInscrito') {
    let headerText = '';
    let messageText = '';
    let iconName = '';

    if (estado === 'yaAcreditado') {
      headerText = 'Ya Acreditado';
      messageText = `${nombreUsuario} ya está acreditado para el evento ${nombreEvento}.`;
      iconName = 'checkmark-circle';
    } else if (estado === 'acreditado') {
      headerText = 'Acreditación Exitosa';
      messageText = `${nombreUsuario} ha sido acreditado para el evento ${nombreEvento}. Se han añadido <strong>${puntos} puntos a su cuenta.`;
      iconName = 'checkmark-circle';
    } else {
      headerText = 'No Inscrito';
      messageText = `${nombreUsuario} no está inscrito en el evento ${nombreEvento}.`;
      iconName = 'close-circle';
    }

    const alert = await this.alertController.create({
      header: headerText,
      message: `
        <div class="custom-alert-content">
          <ion-icon name="${iconName}" class="alert-icon ${estado === 'noInscrito' ? 'error' : 'success'}"></ion-icon>
          <p>${messageText}</p>
        </div>
      `,
      cssClass: 'custom-alert',
      buttons: ['OK']
    });
    await alert.present();
  }

  async startScan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17,
        cameraDirection: 1,
      });

      const qrData = result.ScanResult;
      const parsedData = JSON.parse(qrData);

      if ((parsedData.id_estudiante || parsedData.id_Invitado) && parsedData.Nombre_completo) {
        return parsedData;
      } else {
        throw new Error('Los datos del QR no son válidos');
      }
    } catch (e) {
      console.error('Error al escanear el código:', e);
      throw e;
    }
  }
}
