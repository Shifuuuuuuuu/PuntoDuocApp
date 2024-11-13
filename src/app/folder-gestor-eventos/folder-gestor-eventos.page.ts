import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Evento } from '../interface/IEventos';
import { MenuController } from '@ionic/angular';
import Swal from 'sweetalert2';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/compat/firestore';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {

  eventos$: Observable<Evento[]> = new Observable<Evento[]>();
  eventosProximos$: Observable<Evento[]> = new Observable<Evento[]>();
  eventosPasados$: Observable<Evento[]> = new Observable<Evento[]>();
  segment: string = 'proximos';

  constructor(
    private eventosService: EventosGestorService,
    private router: Router,
    private menu: MenuController,
    private firestore: AngularFirestore
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
        const docId = snapshot.payload.doc.id; // ID del documento de Firestore

        // Asegúrate de usar la propiedad correcta para la fecha
        eventData.fechaInicio = this.transformarFecha(eventData.fecha); // Ajusta 'fecha' si es necesario
        eventData.fechaFin = this.transformarFecha(eventData.fecha_termino);

        return {
          ...eventData,
          id_evento: docId, // Utiliza el ID del documento de Firestore
          verificado: false,
          show: false,
          estaInscrito: false,
          enListaEspera: false
        };
      }))
    );

    // Filtrar eventos próximos
    this.eventosProximos$ = this.eventos$.pipe(
      map(eventos => eventos.filter(evento => evento.fechaInicio && evento.fechaInicio > new Date()))
    );

    // Filtrar eventos pasados
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



  // Verificar si el botón "Comenzar Evento" debe mostrarse
  puedeMostrarComenzarEvento(fechaInicio: Date | null, estado: string): boolean {
    const ahora = new Date();
    return fechaInicio ? ahora >= fechaInicio && estado !== 'en_curso' && estado !== 'cancelado' : false;
  }

  comenzarEvento(evento: Evento) {
    const eventoId = evento.id_evento; // Usa el ID del documento, que ahora se llama `id_evento`

    this.eventosService.actualizarEvento(eventoId, { estado: 'en_curso' }).then(() => {
      console.log('Evento comenzado.');
      Swal.fire({
        icon: 'success',
        title: 'Evento iniciado',
        text: 'El evento ha comenzado. Ahora puedes ver el detalle del evento.',
        confirmButtonText: 'OK'
      });
      this.cargarEventos(); // Recargar la lista de eventos para reflejar el cambio de estado
    }).catch(error => {
      console.error('Error al comenzar el evento:', error);
      Swal.fire('Error', 'No se pudo iniciar el evento: ' + error.message, 'error');
    });
  }

  // Verificar si el evento está en curso
  eventoEnCurso(evento: Evento): boolean {
    return evento.estado === 'en_curso';
  }

  // Ir a los detalles del evento
  verDetalles(evento: Evento) {
    if (this.eventoEnCurso(evento)) {
      this.router.navigate(['/detalles-evento', evento.id_evento]);
    }
  }

  // Cancelar evento y mostrar alerta
  cancelarEvento(eventoId: string) {
    this.eventosService.actualizarEvento(eventoId, { estado: 'cancelado' }).then(() => {
      console.log('Evento cancelado.');
      Swal.fire({
        icon: 'error',
        title: 'Evento cancelado',
        text: 'El evento ha sido cancelado exitosamente.',
        confirmButtonText: 'OK'
      });
      this.cargarEventos(); // Recargar la lista de eventos para reflejar el cambio de estado
    });
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
          this.cargarEventos(); // Actualizar la lista de eventos
        }).catch(error => {
          Swal.fire('Error', 'Hubo un problema al eliminar el evento: ' + error.message, 'error');
        });
      }
    });
  }
}
