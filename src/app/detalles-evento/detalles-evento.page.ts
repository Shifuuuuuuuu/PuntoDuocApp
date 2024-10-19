import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Estudiante } from '../interface/IEstudiante';

@Component({
  selector: 'app-detalles-evento',
  templateUrl: './detalles-evento.page.html',
  styleUrls: ['./detalles-evento.page.scss'],
})
export class DetallesEventoPage implements OnInit {
  eventoId: string = ''; // Inicialización como cadena vacía
  isInvitado: boolean = false;
  evento: any;
  barcodes: any[] = []; // Array para almacenar los resultados del escáner
  isSupported: boolean = true; // Verificar soporte para escáner
  mensajePresencia: string = ''; // Mensaje de presencia

  constructor(
    private route: ActivatedRoute,
    private eventosService: EventosGestorService,
    private firestore: AngularFirestore,
  ) {}

  ngOnInit() {
    // Manejar el caso en que 'id' puede ser null
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventoId = id;
      this.eventosService.getEventoById(this.eventoId).subscribe((data) => {
        this.evento = data;
      });
    } else {
      console.error('No se encontró el ID del evento.');
    }
  }

  async scan() {
    try {
      // Verifica los permisos
      const permissionStatus = await BarcodeScanner.checkPermission({ force: true });

      // Verificamos si el permiso ha sido otorgado
      if (permissionStatus.granted) {
        // Ocultar la interfaz de usuario mientras se escanea (opcional)
        BarcodeScanner.hideBackground();

        // Comienza a escanear
        const result = await BarcodeScanner.startScan();

        // Detener el escaneo después de obtener el resultado
        BarcodeScanner.stopScan();

        // Verificar si se ha escaneado algo
        if (result.hasContent) {
          console.log('Código QR escaneado:', result.content);

          // Agregar el contenido escaneado a la lista de códigos
          this.barcodes.push({ rawValue: result.content, format: 'QR Code' });

          // Verificar inscripción con el contenido escaneado
          this.verificarInscripcion(this.eventoId, result.content);
        } else {
          console.error('No se encontró contenido en el código QR');
        }
      } else if (permissionStatus.denied) {
        // Si el permiso fue denegado permanentemente, podemos dirigir al usuario a los ajustes
        console.error('Permiso denegado permanentemente, el usuario debe habilitarlo desde la configuración.');
        BarcodeScanner.openAppSettings();
      } else {
        // Si el permiso no ha sido otorgado, muestre un mensaje adecuado
        console.error('Permiso denegado para usar la cámara');
      }
    } catch (error) {
      console.error('Error al escanear: ', error);
    }
  }



  verificarInscripcion(eventoId: string, idUsuario: string): void {
    this.eventosService.obtenerInscripcion(eventoId, idUsuario).then((inscripcion: boolean) => {
      if (inscripcion) {
        if (this.isInvitado) {
          console.log(`El invitado ${idUsuario} está presente en el evento ${eventoId}`);
          this.mensajePresencia = `El invitado ${idUsuario} está presente en el evento.`;
          this.actualizarEstadoAsistencia(eventoId, idUsuario); // Solo actualiza el estado de asistencia
        } else {
          console.log(`El estudiante ${idUsuario} está inscrito en el evento ${eventoId}`);
          this.sumarPuntosUsuario(idUsuario, 200); // Sumar puntos por asistencia
          this.mensajePresencia = `El estudiante ${idUsuario} está presente en el evento.`;
          this.actualizarEstadoAsistencia(eventoId, idUsuario); // Actualizar estado de asistencia
        }
      } else {
        console.log(`El usuario ${idUsuario} no está inscrito en el evento ${eventoId}`);
        this.mensajePresencia = `El usuario ${idUsuario} no está inscrito en el evento.`;
      }
    });
  }

  sumarPuntosUsuario(idEstudiante: string, puntos: number): void {
    const estudianteRef = this.firestore.doc<Estudiante>(`Estudiantes/${idEstudiante}`); // Especifica el tipo

    estudianteRef.ref.get().then((doc) => {
      if (doc.exists) {
        const estudianteData = doc.data() as Estudiante; // Asegúrate de usar la interfaz
        const puntajeActual = estudianteData?.puntaje || 0; // Accede al puntaje

        // Actualizar el puntaje del estudiante
        estudianteRef.update({
          puntaje: puntajeActual + puntos,
        })
        .then(() => {
          console.log(`Se han añadido ${puntos} puntos al estudiante ${idEstudiante}`);
        })
        .catch((error) => {
          console.error('Error al sumar puntos: ', error);
        });
      } else {
        console.error(`No se encontró el estudiante con id ${idEstudiante}`);
      }
    });
  }

  actualizarEstadoAsistencia(eventoId: string, idUsuario: string): void {
    const inscripcionRef = this.firestore.doc(`Inscripciones/${eventoId}_${idUsuario}`);

    inscripcionRef.update({
      asistenciaVerificada: true, // Cambiar el estado a asistencia verificada
      fechaAsistencia: new Date(), // Registrar la fecha y hora de la asistencia
    })
    .then(() => {
      console.log(`Asistencia verificada para el usuario ${idUsuario} en el evento ${eventoId}`);
    })
    .catch((error) => {
      console.error('Error al actualizar la asistencia: ', error);
    });
  }
}
