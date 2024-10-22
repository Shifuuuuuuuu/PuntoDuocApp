import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Evento } from '../interface/IEventos';
import { MenuController } from '@ionic/angular';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {

  eventos$: Observable<Evento[]> = new Observable<Evento[]>();

  constructor(private eventosService: EventosGestorService, private router: Router,private menu: MenuController) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }
  ngOnInit() {
    this.cargarEventos();
  }

  // Cargar eventos desde Firestore
  cargarEventos() {
    this.eventos$ = this.eventosService.getEventos().pipe(
      map((eventos: Evento[]) => eventos.map((evento: Evento) => {
        evento.fecha = this.transformarFecha(evento.fecha); // Transformar la fecha antes de asignarla
        return evento;
      }))
    );
  }

  // Función que transforma la fecha
  transformarFecha(fecha: any): string {
    // Si fecha es un timestamp de Firestore, convertirla a formato legible
    if (fecha && typeof fecha !== 'string' && fecha.seconds) {
      const date = new Date(fecha.seconds * 1000); // Convertir seconds a milisegundos
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Si ya es una cadena, devolverla tal cual
    return fecha;
  }

  // Ir a los detalles del evento
  verDetalles(eventoId: string) {
    this.router.navigate(['/detalles-evento', eventoId]);
  }

  // Cancelar evento
  cancelarEvento(eventoId: string) {
    this.eventosService.actualizarEvento(eventoId, { estado: 'cancelado' }).then(() => {
      console.log('Evento cancelado.');
    });
  }
}
