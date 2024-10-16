import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { QRScanner } from '@ionic-native/qr-scanner/ngx';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
@Component({
  selector: 'app-detalles-evento',
  templateUrl: './detalles-evento.page.html',
  styleUrls: ['./detalles-evento.page.scss'],
})
export class DetallesEventoPage implements OnInit {
  eventoId: string = ''; // Inicialización como cadena vacía
  evento: any;

  constructor(
    private route: ActivatedRoute,
    private eventosService: EventosGestorService,
    private qrScanner: QRScanner,
    private firestore: AngularFirestore,
    private platform: Platform,
    private androidPermissions: AndroidPermissions
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

  verificarAsistencia() {
    // Lógica para verificar la asistencia
    console.log(`Verificando asistencia para el evento ${this.eventoId}`);

    // Verificar si Cordova está disponible
    if (this.platform.is('cordova')) {
      this.escanearCodigoQR(this.eventoId); // Llama a escanearCodigoQR solo si Cordova está disponible
    } else {
      console.error('Cordova no está disponible. Asegúrate de estar ejecutando la aplicación en un dispositivo real o emulador.');
    }
  }

  escanearCodigoQR(eventoId: string) {
    this.qrScanner.prepare().then((status: any) => {
      if (status.authorized) {
        this.qrScanner.show(); // Muestra el escáner
        const scanSub = this.qrScanner.scan().subscribe((userId: string) => {
          this.qrScanner.hide(); // Esconde el escáner
          this.verificarInscripcion(eventoId, userId);
          scanSub.unsubscribe(); // Desuscribirse después de escanear
        });
      } else {
        console.error('Permiso denegado para acceder a la cámara.');
      }
    }).catch((e: any) => console.log('Error en el escáner: ', e));
  }
  verificarPermisos() {
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
      result => {
        if (!result.hasPermission) {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
        } else {
          this.verificarAsistencia(); // Llama a la función para escanear
        }
      },
      err => {
        console.error('Error al verificar permisos:', err); // Manejo del error
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
      }
    );
}


  verificarInscripcion(eventoId: string, idEstudiante: string): void {
    this.eventosService.obtenerInscripcion(eventoId, idEstudiante).then((inscripcion: boolean) => {
      if (inscripcion) {
        console.log(`El estudiante ${idEstudiante} está inscrito en el evento ${eventoId}`);
        this.sumarPuntosUsuario(idEstudiante, 200); // Sumar puntos por asistencia
        this.actualizarEstadoAsistencia(eventoId, idEstudiante); // Actualizar estado de asistencia
      } else {
        console.log(`El estudiante ${idEstudiante} no está inscrito en el evento ${eventoId}`);
      }
    });
  }


  sumarPuntosUsuario(idEstudiante: string, puntos: number): void {
    const estudianteRef = this.firestore.doc<Estudiante>(`Estudiantes/${idEstudiante}`); // Especifica el tipo

    estudianteRef.ref.get().then((doc) => {
      if (doc.exists) {
        const estudianteData = doc.data() as Estudiante; // Usar la interfaz
        const puntajeActual = estudianteData?.puntaje || 0; // Acceder directamente a puntaje

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

  actualizarEstadoAsistencia(eventoId: string, idEstudiante: string): void {
    const inscripcionRef = this.firestore.doc(`Inscripciones/${eventoId}_${idEstudiante}`);

    inscripcionRef.update({
      asistenciaVerificada: true, // Cambiar el estado a asistencia verificada
      fechaAsistencia: new Date(), // Registrar la fecha y hora de la asistencia
    })
    .then(() => {
      console.log(`Asistencia verificada para el estudiante ${idEstudiante} en el evento ${eventoId}`);
    })
    .catch((error) => {
      console.error('Error al actualizar la asistencia: ', error);
    });
  }
}
