import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';

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
