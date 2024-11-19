import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import Swal from 'sweetalert2';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { EstudianteService } from '../services/estudiante.service';
import { Evento } from '../interface/IEventos';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { Comentario } from '../interface/IComentario';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.page.html',
  styleUrls: ['./event-details.page.scss'],
})
export class EventDetailsPage implements OnInit {
  event: Evento | undefined;
  userId: string = '';
  userName: string = '';
  isInvitado: boolean = false;
  loading: boolean = false;
  unreadNotificationsCount: number = 0;
  comentarios: Comentario[] = [];
  comentario: string = '';
  calificacion: number = 0;
  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private estudianteService: EstudianteService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id_evento');
    if (eventId) {
      await this.identificarUsuario();
      await this.loadEventDetails(eventId);
      this.loadComentarios(eventId);
    }
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

  async identificarUsuario() {
    try {
      const emailInvitado = await firstValueFrom(this.invitadoService.getCurrentUserEmail());
      if (emailInvitado) {
        const invitado = await this.invitadoService.getInvitadoByEmail(emailInvitado);
        if (invitado) {
          this.userId = invitado.id_Invitado!;
          this.userName = invitado.Nombre_completo;
          this.isInvitado = true;
          return;
        }
      }

      const emailEstudiante = await firstValueFrom(this.authService.getCurrentUserEmail());
      if (emailEstudiante) {
        const estudiante = await this.estudianteService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.userName = estudiante.Nombre_completo;
          this.isInvitado = false;
        }
      }
    } catch (error) {
      console.error('Error al identificar al usuario:', error);
    }
  }

  async loadEventDetails(eventId: string) {
    this.loading = true;

    this.firestore.collection<Evento>('Eventos').doc(eventId).snapshotChanges().subscribe(
      async (snapshot) => {
        if (snapshot.payload.exists) {
          const documentId = snapshot.payload.id;
          const eventData = snapshot.payload.data() as Evento;

          this.event = {
            ...eventData,
            id_evento: documentId,
            verificado: false
          };

          await this.actualizarEstadoInscripcion(); // Asegura que el estado de inscripción se actualice al cargar el evento
          this.loading = false;
          this.cdr.detectChanges(); // Forzar la detección de cambios
        } else {
          console.log('El evento con el ID especificado no existe.');
          this.loading = false;
        }
      },
      (error) => {
        console.error('Error al obtener detalles del evento:', error);
        this.loading = false;
      }
    );
}
  async guardarComentario() {
    if (!this.comentario.trim()) {
      Swal.fire('Error', 'El comentario no puede estar vacío.', 'error');
      return;
    }

    try {
      const comentarioData = {
        id_comentario: this.firestore.createId(),
        id_evento: this.event?.id_evento || '',
        titulo_evento: this.event?.titulo || '',
        id_usuario: this.userId,
        nombre_completo: this.userName,
        descripcion: this.comentario,
        fecha: new Date(),
        calificacion: this.calificacion
      };

      await this.firestore.collection('Comentarios').doc(comentarioData.id_comentario).set(comentarioData);
      this.comentario = ''; // Limpia el campo de comentario
      this.calificacion = 0; // Limpia la calificación
      Swal.fire('Éxito', 'Comentario guardado exitosamente.', 'success');
      this.loadComentarios(this.event?.id_evento || '');
    } catch (error) {
      console.error('Error al guardar el comentario:', error);
      Swal.fire('Error', 'No se pudo guardar el comentario. Inténtalo más tarde.', 'error');
    }
  }
  async loadComentarios(eventId: string) {
    this.firestore.collection<Comentario>('Comentarios', ref => ref.where('id_evento', '==', eventId))
      .valueChanges().subscribe(comentarios => {
        this.comentarios = comentarios;
      });
  }
  async guardarCalificacion() {
    if (this.calificacion < 1 || this.calificacion > 5) {
      Swal.fire('Error', 'La calificación debe estar entre 1 y 5.', 'error');
      return;
    }

    try {
      const calificacionData = {
        id_puntacion: this.firestore.createId(),
        id_evento: this.event?.id_evento || '',
        titulo_evento: this.event?.titulo || '',
        id_usuario: this.userId,
        nombre_completo: this.userName,
        calificacion: this.calificacion,
        fecha: new Date()
      };

      await this.firestore.collection('Puntaciones').doc(calificacionData.id_puntacion).set(calificacionData);
      this.calificacion = 0; // Limpia la calificación
      Swal.fire('Éxito', 'Calificación guardada exitosamente.', 'success');
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      Swal.fire('Error', 'No se pudo guardar la calificación. Inténtalo más tarde.', 'error');
    }
  }
  async actualizarEstadoInscripcion() {
    if (!this.event) return;

    const usuarioId = this.isInvitado ? 'id_invitado' : 'id_estudiante';
    const usuarioInscripcion = this.event.Inscripciones?.find(inscripcion => inscripcion[usuarioId] === this.userId);

    this.event.estaInscrito = !!usuarioInscripcion;
    this.event.verificado = usuarioInscripcion?.verificado === true;

    try {
      // Verificar si el usuario está en la lista de espera
      this.event.enListaEspera = await this.eventosService.isUserInWaitList(this.event.id_evento, this.userId);

      // Lógica de inscripción automática si hay cupos disponibles y usuarios en lista de espera
      if (this.event.Cupos > 0 && this.event.listaEspera && this.event.listaEspera.length > 0) {
        console.log('Cupos disponibles:', this.event.Cupos);
        console.log('Usuarios en lista de espera:', this.event.listaEspera);

        // Inscribir automáticamente al primer usuario en la lista de espera
        const primerUsuario = this.event.listaEspera[0];
        console.log('Contenido de primerUsuario:', primerUsuario);

        // Asignar las propiedades de manera manual
        const userId = primerUsuario.id_Invitado || primerUsuario.id_estudiante;
        const userName = primerUsuario.Nombre_completo || primerUsuario.userName;
        const rut = primerUsuario.Rut || primerUsuario.rut;

        console.log('Intentando inscribir al usuario:', userId, userName, rut);

        if (userId) {
          if (primerUsuario.id_Invitado) {
            console.log('Inscribiendo como invitado...');
            await this.eventosService.inscribirInvitado(this.event.id_evento, userId, userName, rut, false);
          } else if (primerUsuario.id_estudiante) {
            console.log('Inscribiendo como estudiante...');
            const estudianteData = await this.estudianteService.obtenerEstudiantePorId(userId);
            const carrera = estudianteData?.carrera || ''; // Obtiene la carrera

            await this.eventosService.inscribirEstudiante(this.event.id_evento, userId, userName, rut, carrera, false);
          }

          // Eliminar al usuario de la lista de espera
          console.log('Eliminando al usuario de la lista de espera:', userId);
          await this.eventosService.eliminarUsuarioDeListaEspera(this.event.id_evento, userId);

          // Reducir el número de cupos disponibles
          console.log('Reduciendo cupos disponibles...');
          await this.firestore.collection('Eventos').doc(this.event.id_evento).update({ Cupos: this.event.Cupos });

          // Recargar los detalles del evento para reflejar los cambios
          await this.loadEventDetails(this.event.id_evento);
        }
      }

      // Actualiza la referencia para que Angular lo detecte y fuerza la detección de cambios
      this.event = { ...this.event };
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al verificar lista de espera o al realizar la inscripción automática:', error);
      this.event.enListaEspera = false;
    }
  }



  async handleEventButtonClick(event: Evento) {
    const usuarioId = this.isInvitado ? 'id_invitado' : 'id_estudiante';
    const usuarioInscripcion = event.Inscripciones?.find(inscripcion => inscripcion[usuarioId] === this.userId);
    const estaInscrito = !!usuarioInscripcion;
    const estaVerificado = usuarioInscripcion?.verificado === true;

    // Si el usuario ya está en la lista de espera
    if (event.enListaEspera) {
      const result = await Swal.fire({
        title: '¿Quieres salir de la lista de espera?',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'No',
      });

      if (result.isConfirmed) {
        try {
          await this.eventosService.eliminarUsuarioDeListaEspera(event.id_evento, this.userId);
          event.enListaEspera = false;
          await this.loadEventDetails(event.id_evento); // Recarga los detalles para actualizar la vista
          Swal.fire('Éxito', 'Has salido de la lista de espera.', 'success');
        } catch (error) {
          console.error('Error al salir de la lista de espera:', error);
          Swal.fire('Error', 'No se pudo salir de la lista de espera. Inténtalo más tarde.', 'error');
        }
      }
      return;
    }

    // Si el usuario ya está inscrito y el evento ha comenzado
    if (estaInscrito && event.estado === 'en_curso') {
      if (estaVerificado) {
        Swal.fire('Verificado', 'Ya estás verificado para este evento. No puedes cancelar tu inscripción.', 'success');
      } else {
        Swal.fire('No puedes cancelar', 'El evento ya ha comenzado. Debes acreditarte o se te restarán puntos.', 'warning');
      }
      return;
    }

    // Si el usuario está inscrito y el evento no ha comenzado, permite cancelar
    if (estaInscrito) {
      await this.cancelarInscripcion(event.id_evento);
    } else {
      await this.presentAlert(event);
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
    if (!this.userId) {
      Swal.fire('Error', 'No se pudo identificar al usuario. Inténtalo más tarde.', 'error');
      return;
    }

    this.loading = true;
    try {
      let userName = '';
      let rut = '';
      let carrera = '';

      if (this.isInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorId(this.userId);
        userName = invitado?.Nombre_completo || 'Invitado';
        rut = invitado?.Rut || '';
        await this.eventosService.inscribirInvitado(eventoId, this.userId, userName, rut, false);
      } else {
        const estudiante = await this.estudianteService.obtenerEstudiantePorId(this.userId);
        userName = estudiante?.Nombre_completo || 'Estudiante';
        rut = estudiante?.Rut || '';
        carrera = estudiante?.carrera || '';
        await this.eventosService.inscribirEstudiante(eventoId, this.userId, userName, rut, carrera, false);
      }

      Swal.fire('Éxito', 'Te has inscrito al evento correctamente.', 'success');
      await this.loadEventDetails(eventoId); // Recarga los detalles del evento
      this.cdr.detectChanges(); // Actualiza la UI
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

          await this.eventosService.eliminarUsuarioDeInscripciones(eventoId, this.userId);

          Swal.fire('Cancelado', 'Has cancelado tu inscripción correctamente.', 'success');
          await this.loadEventDetails(eventoId); // Recarga los detalles del evento
          this.cdr.detectChanges(); // Actualiza la UI
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
