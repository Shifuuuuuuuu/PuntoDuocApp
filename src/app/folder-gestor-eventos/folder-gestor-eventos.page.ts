import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Evento } from '../interface/IEventos';
import { MenuController } from '@ionic/angular';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {

  eventos$: Observable<Evento[]> = new Observable<Evento[]>();

  constructor(
    private eventosService: EventosGestorService,
    private router: Router,
    private menu: MenuController
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ngOnInit() {
    this.cargarEventos();
  }

  // Cargar eventos desde Firestore
  cargarEventos() {
    this.eventos$ = this.eventosService.getEventos().pipe(
      map((eventos: Evento[]) => eventos.map((evento: Evento) => {
        evento.fechaInicio = this.transformarFecha(evento.fecha);
        evento.fechaFin = this.transformarFecha(evento.fecha_termino);
        return evento;
      }))
    );
  }

  transformarFecha(fecha: any): Date | null {
    if (fecha && fecha.seconds) {
      return new Date(fecha.seconds * 1000); // Convertimos de Firestore timestamp a Date
    }
    return null;
  }

  // Verificar si el botón "Comenzar Evento" debe mostrarse
  puedeMostrarComenzarEvento(fechaInicio: Date | null, estado: string): boolean {
    const ahora = new Date();
    return fechaInicio ? ahora >= fechaInicio && estado !== 'en_curso' && estado !== 'cancelado' : false;
  }

  // Comenzar evento y mostrar alerta
  comenzarEvento(eventoId: string) {
    this.eventosService.actualizarEvento(eventoId, { estado: 'en_curso' }).then(() => {
      console.log('Evento comenzado.');
      Swal.fire({
        icon: 'success',
        title: 'Evento iniciado',
        text: 'El evento ha comenzado. Ahora puedes ver el detalle del evento.',
        confirmButtonText: 'OK'
      });
      this.cargarEventos(); // Recargar la lista de eventos para reflejar el cambio de estado
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
}
