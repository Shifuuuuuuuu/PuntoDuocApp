import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { map, Observable, of, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Evento } from '../interface/IEventos';
import Swal from 'sweetalert2';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MessagingService } from '../services/messaging.service';
import { TareasGestor } from '../interface/ITareasGestor';
import { GestorEventosService } from '../services/gestoreventos.service';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {
  eventosHoy$: Observable<Evento[]> = new Observable<Evento[]>();
  private eventosHoy: Evento[] = [];
  gestorId: string = '';
  constructor(
    private eventosService: EventosGestorService,
    private firestore: AngularFirestore,
    private messagingService: MessagingService,
    private router: Router,
    private gestorEventos: GestorEventosService
  ) {}

  ngOnInit() {

    this.obtenerGestorId().then(() => {

      this.cargarEventosHoy();
    });
    this.enviarRecordatorios();
  }


  enviarRecordatorios() {
    this.eventosHoy$
      .pipe(
        map(eventos =>
          eventos.filter(evento => {
            const ahora = new Date();
            const enUnaHora = new Date(ahora.getTime() + 60 * 60 * 1000); // Tiempo actual + 1 hora
            return (
              evento.fechaInicio &&
              evento.fechaInicio > ahora &&
              evento.fechaInicio <= enUnaHora
            );
          })
        )
      )
      .subscribe(async eventos => {
        for (const evento of eventos) {
          const notificationData = {
            id: evento.id_evento,
            titulo: `Recordatorio: "${evento.titulo}" comienza en 1 hora`,
            descripcion: 'No olvides prepararte para este evento.',
            imagen: evento.imagen || '',
            url: `/perfil-usuario`,
            fecha: new Date(),
          };

          await this.enviarNotificacion(notificationData);
        }
      });
  }

  async obtenerGestorId() {
    try {
      const gestor = await this.gestorEventos.obtenerGestorAutenticado();
      if (gestor) {
        this.gestorId = gestor.id_Geventos || '';

      } else {
        console.error('No se encontró un gestor autenticado.');
      }
    } catch (error) {
      console.error('Error al obtener el gestor autenticado:', error);
    }
  }




  cargarEventosHoy() {

    this.eventosHoy$ = this.firestore
      .collection<TareasGestor>('TareasGestor', ref => ref.where('gestor_id', '==', this.gestorId)) // Filtrar por gestor_id
      .valueChanges()
      .pipe(
        switchMap((tareas: TareasGestor[]) => {

          const eventoIds = tareas.map(tarea => tarea.evento_id); // Extraer IDs de eventos

          if (eventoIds.length === 0) {

            return of([]); // Retornar un observable vacío si no hay eventos
          }

          return this.firestore
            .collection<Evento>('Eventos', ref => {

              return ref.where(firebase.firestore.FieldPath.documentId(), 'in', eventoIds);
            })
            .snapshotChanges();
        }),
        map(snapshot => {

          const eventos = snapshot.map(doc => {
            const data = doc.payload.doc.data() as Evento;
            const id = doc.payload.doc.id;

            const fechaInicio = this.transformarFecha(data.fecha);
            const fechaFin = this.transformarFecha(data.fecha_termino);
            return { ...data, id_evento: id, fechaInicio, fechaFin };
          });

          return eventos;
        })
      );
  }



  comenzarDia(fecha: Date): Date {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  finalizarDia(fecha: Date): Date {
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    return fin;
  }

  puedeMostrarComenzar(evento: Evento): boolean {
    const ahora = new Date();
    const fechaInicio = this.transformarFecha(evento.fecha);
    const fechaFin = this.transformarFecha(evento.fecha_termino);

    if (!fechaInicio || !fechaFin) {
      return false;
    }
    // Verificar si está dentro del rango y el estado es Aprobado
    const dentroDeRango = ahora >= fechaInicio && ahora <= fechaFin;
    const esAprobado = evento.estado === 'Aprobado';
    return dentroDeRango && esAprobado;
  }


  transformarFecha(fecha: any): Date | null {
    if (fecha && fecha.seconds) {
      return new Date(fecha.seconds * 1000); // Firestore Timestamp
    }
    if (typeof fecha === 'string' || fecha instanceof Date) {
      return new Date(fecha); // String o Date válida
    }
    return null;
  }

  async comenzarEvento(evento: Evento) {
    try {
      await this.eventosService.actualizarEvento(evento.id_evento, { estado: 'en_curso' });
      Swal.fire({
        icon: 'success',
        title: 'Evento iniciado',
        text: `El evento "${evento.titulo}" ha comenzado.`,
        confirmButtonText: 'OK',
      });

      const notificationData = {
        id: evento.id_evento,
        titulo: `El evento "${evento.titulo}" ha comenzado`,
        descripcion: 'Recuerda acreditarte para evitar penalización.',
        imagen: evento.imagen || '',
        url: `/perfil-usuario`,
        fecha: new Date(),
      };

      await this.enviarNotificacion(notificationData);

      // Actualizar el estado en la lista local
      this.actualizarEstadoEventoLocal(evento.id_evento, 'en_curso');
    } catch (error) {
      console.error('Error al comenzar el evento:', error);
      Swal.fire('Error', 'No se pudo iniciar el evento.', 'error');
    }
  }

  actualizarEstadoEventoLocal(eventoId: string, nuevoEstado: string) {
    this.eventosHoy = this.eventosHoy.map(evento =>
      evento.id_evento === eventoId ? { ...evento, estado: nuevoEstado } : evento
    );
  }


  eventoEnCurso(evento: Evento): boolean {
    return evento.estado === 'en_curso';
  }

  verDetalles(evento: Evento) {
    if (evento.estado === 'en_curso' || evento.estado === 'finalizado' || evento.estado === 'completado') {
      this.router.navigate(['/detalles-evento', evento.id_evento]);
    } else {
      Swal.fire('Aviso', 'Este evento no tiene detalles disponibles.', 'info');
    }
  }

  async cancelarEvento(evento: Evento) {
    try {
      // Validar si el evento está en curso
      if (evento.estado === 'en_curso') {
        Swal.fire({
          icon: 'warning',
          title: 'No se puede cancelar',
          text: `El evento "${evento.titulo}" ya ha comenzado y no puede ser cancelado.`,
          confirmButtonText: 'OK',
        });
        return; // Salir sin realizar ninguna acción
      }

      // Proceder con la cancelación si no está en curso
      await this.eventosService.actualizarEvento(evento.id_evento, { estado: 'cancelado' });
      Swal.fire({
        icon: 'error',
        title: 'Evento cancelado',
        text: `El evento "${evento.titulo}" ha sido cancelado.`,
        confirmButtonText: 'OK',
      });

      const notificationData = {
        id: evento.id_evento,
        titulo: `El evento "${evento.titulo}" ha sido cancelado`,
        descripcion: 'El evento ha sido cancelado por el organizador.',
        imagen: evento.imagen || '',
        fecha: new Date(),
      };

      await this.enviarNotificacion(notificationData);
      this.cargarEventosHoy();
    } catch (error) {
      console.error('Error al cancelar el evento:', error);
    }
  }

  async enviarNotificacion(notification: any) {
    try {
      const eventoRef = await this.firestore.collection('Eventos').doc(notification.id).get().toPromise();
      if (eventoRef && eventoRef.exists) {
        const eventoData = eventoRef.data() as Evento;
        if (eventoData && eventoData.Inscripciones && eventoData.Inscripciones.length > 0) {
          const usuariosNotificados = new Set<string>();
          for (const inscrito of eventoData.Inscripciones) {
            const usuarioId = inscrito.id_estudiante || inscrito.id_invitado;
            if (usuarioId && !usuariosNotificados.has(usuarioId)) {
              usuariosNotificados.add(usuarioId);
              const personalizedNotification = {
                ...notification,
                usuarioIds: [{ userId: usuarioId, leido: false }],
                fechaTermino: this.calcularFechaTermino()
              };
              await this.messagingService.sendNotification(personalizedNotification);
              console.log(`Notificación enviada a usuario ${usuarioId}`);
            }
          }
        } else {
          console.log('No hay usuarios inscritos para este evento.');
        }
      } else {
        console.error('El evento no existe o no se pudo obtener la información.');
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      Swal.fire('Error', 'Hubo un problema al enviar la notificación: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
    }
  }

  calcularFechaTermino(): Date {
    const fechaActual = new Date();
    fechaActual.setDate(fechaActual.getDate() + 7);
    return fechaActual;
  }
}
