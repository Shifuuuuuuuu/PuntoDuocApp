import { Component, OnInit } from '@angular/core';
import { EventosGestorService } from '../services/eventos-gestor.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';


@Component({
  selector: 'app-folder-gestor-eventos',
  templateUrl: './folder-gestor-eventos.page.html',
  styleUrls: ['./folder-gestor-eventos.page.scss'],
})
export class FolderGestorEventosPage implements OnInit {

  eventos$: Observable<any[]> = new Observable<any[]>();

  constructor(private eventosService: EventosGestorService,private router: Router) {}

  ngOnInit() {
    this.cargarEventos();
  }

  // Cargar eventos desde Firestore
  cargarEventos() {
    this.eventos$ = this.eventosService.getEventos();
  }

  // Ir a los detalles del evento
  verDetalles(eventoId: string) {
    // Navegar a la página de detalles con el id del evento
    this.router.navigate(['/detalles-evento', eventoId]);
  }

  // Verificar inscripción de un usuario
  verificarInscripcion(eventoId: string, userId: string) {
    this.eventosService.verificarInscripcion(eventoId, userId).subscribe(inscripciones => {
      if (inscripciones.length > 0) {
        console.log(`Usuario ${userId} está inscrito en el evento ${eventoId}`);
        // Aquí podrías agregar puntos al usuario, mostrar una notificación, etc.
      } else {
        console.log('Usuario no está inscrito.');
      }
    });
  }

  // Cancelar evento
  cancelarEvento(eventoId: string) {
    this.eventosService.actualizarEvento(eventoId, { estado: 'cancelado' }).then(() => {
      console.log('Evento cancelado.');
    });
  }
}
