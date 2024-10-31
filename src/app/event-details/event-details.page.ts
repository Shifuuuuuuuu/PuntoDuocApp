import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import Swal from 'sweetalert2';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { EstudianteService } from '../services/estudiante.service';
import { Evento } from '../interface/IEventos';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.page.html',
  styleUrls: ['./event-details.page.scss'],
})
export class EventDetailsPage implements OnInit {
  event: Evento | undefined;
  userId: string = '';
  isInvitado: boolean = false;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private estudianteService: EstudianteService
  ) {}

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id_evento');
    if (eventId) {
      await this.loadEventDetails(eventId);
    }

    const emailEstudiante = await this.authService.getCurrentUserEmail().toPromise();
    if (emailEstudiante) {
      const estudiante = await this.authService.getEstudianteByEmail(emailEstudiante);
      if (estudiante) {
        this.userId = estudiante.id_estudiante!;
        this.isInvitado = false;
        return;
      }
    }

    const emailInvitado = await this.invitadoService.getCurrentUserEmail().toPromise();
    if (emailInvitado) {
      const invitado = await this.invitadoService.obtenerInvitadoPorEmail(emailInvitado).toPromise();
      if (invitado) {
        this.userId = invitado.id_Invitado!;
        this.isInvitado = true;
      }
    }
  }

  async loadEventDetails(eventId: string) {
    this.loading = true;
    this.firestore.collection<Evento>('Eventos').doc(eventId).valueChanges().subscribe(async (event) => {
      if (event) {
        this.event = { ...event, verificado: false }; // Añadir `verificado` por defecto en false

        if (this.userId && this.event.id_evento) {
          const usuarioId = this.isInvitado ? 'id_invitado' : 'id_estudiante';
          const usuarioInscripcion = this.event.Inscripciones?.find(inscripcion => inscripcion[usuarioId] === this.userId);
          this.event.estaInscrito = !!usuarioInscripcion;
          this.event.verificado = usuarioInscripcion?.verificado === true;

          try {
            this.event.enListaEspera = await this.eventosService.isUserInWaitList(this.event.id_evento, this.userId);
          } catch (error) {
            console.error('Error al verificar lista de espera:', error);
            this.event.enListaEspera = false;
          }
        }
      }
      this.loading = false;
    });
  }

  async handleEventButtonClick(event: Evento) {
    const usuarioId = this.isInvitado ? 'id_invitado' : 'id_estudiante';
    const usuarioInscripcion = event.Inscripciones?.find(inscripcion => inscripcion[usuarioId] === this.userId);
    const estaInscrito = !!usuarioInscripcion;
    const estaVerificado = usuarioInscripcion?.verificado === true;

    if (event.estado === 'en_curso' && estaInscrito && estaVerificado) {
      Swal.fire('Verificado', 'Ya estás verificado para este evento. No puedes cancelar tu inscripción.', 'success');
      return;
    }

    if (event.estado === 'en_curso' && estaInscrito && !estaVerificado) {
      Swal.fire('No puedes cancelar', 'El evento ya ha comenzado. Debes acreditarte o se te restarán puntos.', 'warning');
      return;
    }

    if (estaInscrito) {
      this.cancelarInscripcion(event.id_evento);
    } else {
      this.presentAlert(event);
    }
  }

  async presentAlert(event: Evento) {
    const result = await Swal.fire({
      title: '¿Quieres inscribirte al evento?',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });

    if (result.isConfirmed) {
      if (event.Cupos > 0) {
        this.inscribirUsuario(event.id_evento);
      } else {
        this.presentWaitListAlert(event);
      }
    }
  }

  async presentWaitListAlert(event: Evento) {
    const result = await Swal.fire({
      title: 'El evento está lleno',
      text: '¿Te gustaría estar en la lista de espera?',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });

    if (result.isConfirmed) {
      let userName = '';
      let rut = '';
      if (this.isInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorId(this.userId);
        userName = invitado?.Nombre_completo || 'Invitado';
        rut = invitado?.Rut || '';
        await this.eventosService.agregarInvitadoAListaEspera(event.id_evento, this.userId, userName, rut);
      } else {
        const estudiante = await this.estudianteService.obtenerEstudiantePorId(this.userId);
        userName = estudiante?.Nombre_completo || 'Estudiante';
        rut = estudiante?.Rut || '';
        await this.eventosService.agregarEstudianteAListaEspera(event.id_evento, this.userId, userName, rut);
      }

      event.enListaEspera = true;
      Swal.fire('Éxito', 'Te has unido a la lista de espera.', 'success');
    }
  }

  async inscribirUsuario(eventoId: string) {
    this.loading = true;
    try {
      let userName = '';
      let rut = '';
      if (this.isInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorId(this.userId);
        userName = invitado?.Nombre_completo || 'Invitado';
        rut = invitado?.Rut || '';
        await this.eventosService.inscribirInvitado(eventoId, this.userId, userName, rut);
      } else {
        const estudiante = await this.estudianteService.obtenerEstudiantePorId(this.userId);
        userName = estudiante?.Nombre_completo || 'Estudiante';
        rut = estudiante?.Rut || '';
        await this.eventosService.inscribirEstudiante(eventoId, this.userId, userName, rut);
      }
      Swal.fire('Éxito', 'Te has inscrito al evento correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', 'No se pudo inscribir en el evento.', 'error');
    } finally {
      this.loading = false;
    }
  }

  async cancelarInscripcion(eventoId: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cancelar tu inscripción en este evento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, mantener inscripción',
    });

    if (result.isConfirmed) {
      try {
        const estaInscrito = this.isInvitado
          ? await this.eventosService.isUserRegisteredInvitado(eventoId, this.userId)
          : await this.eventosService.isUserRegisteredEstudiante(eventoId, this.userId);

        if (estaInscrito) {
          if (this.isInvitado) {
            await this.eventosService.cancelarInscripcionInvitado(eventoId, this.userId);
          } else {
            await this.eventosService.cancelarInscripcionEstudiante(eventoId, this.userId);
          }

          // Eliminar la inscripción del array 'Inscripciones' en la colección de 'Eventos'
          await this.eventosService.eliminarUsuarioDeInscripciones(eventoId, this.userId);

          // Actualizar el perfil del usuario para reflejar el cambio de inscripción
          await this.actualizarPerfilUsuario(eventoId, 'eliminar');

          Swal.fire('Cancelado', 'Has cancelado tu inscripción correctamente.', 'success');

          // Recargar los detalles del evento para reflejar el cambio
          await this.loadEventDetails(eventoId);
        } else {
          Swal.fire('No inscrito', 'No estás inscrito en este evento.', 'info');
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudo cancelar la inscripción. Inténtalo más tarde.', 'error');
      }
    }
  }
  async actualizarPerfilUsuario(eventoId: string, accion: 'agregar' | 'eliminar') {
    try {
      if (this.isInvitado) {
        if (accion === 'agregar') {
          await this.invitadoService.agregarEventoAInvitado(this.userId, eventoId);
        } else {
          await this.invitadoService.eliminarEventoDeInvitado(this.userId, eventoId);
        }
      } else {
        if (accion === 'agregar') {
          await this.estudianteService.agregarEventoAEstudiante(this.userId, eventoId);
        } else {
          await this.estudianteService.eliminarEventoDeEstudiante(this.userId, eventoId);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar tu perfil. Inténtalo más tarde.'
      });
    }
  }

  transformarFecha(fecha: any): Date | null {
    if (fecha && fecha.seconds) {
      return new Date(fecha.seconds * 1000); // Convierte Firestore timestamp a Date
    }
    return null;
  }
}
