import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Evento } from '../interface/IEventos';
import { MenuController } from '@ionic/angular';
import Swal from 'sweetalert2';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';
import { MessagingService } from '../services/messaging.service';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {

  eventos$: Observable<Evento[]> = new Observable<Evento[]>();
  eventosProximos$: Observable<Evento[]> = new Observable<Evento[]>();
  eventosHoy$: Observable<Evento[]> = new Observable<Evento[]>();
  eventosPasados$: Observable<Evento[]> = new Observable<Evento[]>();
  segment: string = 'proximos';

  constructor(
    private eventosService: EventosGestorService,
    private router: Router,
    private menu: MenuController,
    private firestore: AngularFirestore,
    private messagingService: MessagingService
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.eventos$ = this.firestore.collection<Evento>('Eventos').snapshotChanges().pipe(
      map(snapshots => snapshots.map(snapshot => {
        const eventData = snapshot.payload.doc.data() as Evento;
        const docId = snapshot.payload.doc.id;

        eventData.fechaInicio = this.transformarFecha(eventData.fecha);
        eventData.fechaFin = this.transformarFecha(eventData.fecha_termino);

        return {
          ...eventData,
          id_evento: docId,
          verificado: false,
          show: false,
          estaInscrito: false,
          enListaEspera: false
        };
      }))
    );

    this.eventosProximos$ = this.eventos$.pipe(
      map(eventos => eventos.filter(evento => evento.fechaInicio && evento.fechaInicio > new Date()))
    );

    this.eventosHoy$ = this.eventos$.pipe(
      map(eventos => eventos.filter(evento => {
        const hoy = new Date();
        return evento.fechaInicio && evento.fechaInicio.toDateString() === hoy.toDateString();
      }))
    );

    this.eventosPasados$ = this.eventos$.pipe(
      map(eventos => eventos.filter(evento => evento.fechaInicio && evento.fechaInicio <= new Date()))
    );
  }

  transformarFecha(fecha: any): Date | null {
    if (fecha && fecha.seconds) {
      const fechaTransformada = new Date(fecha.seconds * 1000);
      return fechaTransformada;
    }
    return null;
  }

  puedeMostrarComenzarEvento(fechaInicio: Date | null, estado: string): boolean {
    const ahora = new Date();
    return fechaInicio ? ahora >= fechaInicio && estado !== 'en_curso' && estado !== 'cancelado' : false;
  }

  async comenzarEvento(evento: Evento) {
    const eventoId = evento.id_evento;
    try {
      await this.eventosService.actualizarEvento(eventoId, { estado: 'en_curso' });
      Swal.fire({
        icon: 'success',
        title: 'Evento iniciado',
        text: 'El evento ha comenzado. Ahora puedes ver el detalle del evento.',
        confirmButtonText: 'OK'
      });

      const notificationData = {
        id: eventoId,
        titulo: `El evento "${evento.titulo}" ha comenzado`,
        descripcion: 'Recuerda acreditarte, para evitar penalización.',
        imagen: evento.imagen || '',
        url: `/perfil-usuario`,
        fecha: new Date()
      };

      await this.enviarNotificacion(notificationData);

      // Actualizar la lista de eventos para reflejar el cambio de estado
      this.cargarEventos();
    } catch (error) {
      console.error('Error al comenzar el evento:', error);
      Swal.fire('Error', 'No se pudo iniciar el evento: ' + (error instanceof Error ? error.message : 'Error desconocido'), 'error');
    }
  }

  eventoEnCurso(evento: Evento): boolean {
    return evento.estado === 'en_curso';
  }

  verDetalles(evento: Evento) {
    console.log('Ver detalles del evento:', evento);
    if (evento.estado === 'en_curso' || evento.estado === 'finalizado' || evento.estado === 'completado') {
      this.router.navigate(['/detalles-evento', evento.id_evento]);
    } else {
      Swal.fire('Aviso', 'Este evento no tiene detalles disponibles.', 'info');
    }
  }

  async cancelarEvento(evento: Evento) {
    try {
      await this.eventosService.actualizarEvento(evento.id_evento, { estado: 'cancelado' });
      Swal.fire({
        icon: 'error',
        title: 'Evento cancelado',
        text: `El evento "${evento.titulo}" ha sido cancelado exitosamente.`,
        confirmButtonText: 'OK'
      });

      const notificationData = {
        id: evento.id_evento,
        titulo: `El evento "${evento.titulo}" ha sido cancelado`,
        descripcion: 'El evento ha sido cancelado por el organizador.',
        imagen: evento.imagen || '',
        fecha: new Date()
      };

      await this.enviarNotificacion(notificationData);
      this.cargarEventos();
    } catch (error) {
      console.error('Error al cancelar el evento:', error);
    }
  }

  eliminarEvento(eventoId: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Este evento se eliminará permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eventosService.eliminarEvento(eventoId).then(() => {
          Swal.fire('Eliminado', 'El evento ha sido eliminado', 'success');
          this.cargarEventos();
        }).catch(error => {
          Swal.fire('Error', 'Hubo un problema al eliminar el evento: ' + error.message, 'error');
        });
      }
    });
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
