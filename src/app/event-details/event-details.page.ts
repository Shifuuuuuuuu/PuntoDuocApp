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
  unreadNotificationsCount: number = 0;

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
    }
    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
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
          this.isInvitado = true;
          return;
        }
      }

      const emailEstudiante = await firstValueFrom(this.authService.getCurrentUserEmail());
      if (emailEstudiante) {
        const estudiante = await this.estudianteService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.isInvitado = false;
        }
      }
    } catch (error) {
      console.error('Error al identificar al usuario:', error);
    }
  }

  async loadEventDetails(eventId: string) {

    this.loading = true;

    // Usa el `id` del documento directamente sin depender de un campo `id_evento`
    this.firestore.collection<Evento>('Eventos').doc(eventId).snapshotChanges().subscribe(
      async (snapshot) => {
        if (snapshot.payload.exists) {
          const documentId = snapshot.payload.id; // ID del documento de Firestore
          const eventData = snapshot.payload.data() as Evento;



          // Crea el objeto `event` sin depender del campo `id_evento` dentro del documento
          this.event = {
            ...eventData,
            id_evento: documentId, // Aquí el `id` es el del documento de Firestore
            verificado: false // Agrega cualquier otra propiedad necesaria
          };


          if (this.userId && documentId) {
            await this.actualizarEstadoInscripcion();
          }
        } else {
          console.log('El evento con el ID especificado no existe.');
        }

        this.loading = false;
      },
      (error) => {
        console.error('Error al obtener detalles del evento:', error);
        this.loading = false;
      }
    );
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
      console.log('Estado de lista de espera:', this.event.enListaEspera); // Depuración

      // Lógica de inscripción automática si hay cupos disponibles y usuarios en lista de espera
      if (this.event.Cupos > 0 && this.event.listaEspera && this.event.listaEspera.length > 0) {
        console.log('Cupos disponibles:', this.event.Cupos);
        console.log('Usuarios en lista de espera:', this.event.listaEspera);

        // Inscribir automáticamente al primer usuario en la lista de espera
        const primerUsuario = this.event.listaEspera[0];
        console.log('Contenido de primerUsuario:', primerUsuario); // Depuración

        // Asignar las propiedades de manera manual
        const userId = primerUsuario.id_Invitado || primerUsuario.id_estudiante
        const userName = primerUsuario.Nombre_completo || primerUsuario.userName;
        const rut = primerUsuario.Rut || primerUsuario.rut;

        console.log('Intentando inscribir al usuario:', userId, userName, rut);

        if (userId) {
          if (this.isInvitado) {
            console.log('Inscribiendo como invitado...');
            await this.eventosService.inscribirInvitado(this.event.id_evento, userId, userName, rut);
          } else {
            console.log('Inscribiendo como estudiante...');
            await this.eventosService.inscribirEstudiante(this.event.id_evento, userId, userName, rut);
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

    if (event.enListaEspera) {
      // Lógica para salir de la lista de espera
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
          this.event = { ...event }; // Actualiza la UI
          Swal.fire('Éxito', 'Has salido de la lista de espera.', 'success');
        } catch (error) {
          console.error('Error al salir de la lista de espera:', error);
          Swal.fire('Error', 'No se pudo salir de la lista de espera. Inténtalo más tarde.', 'error');
        }
      }
      return;
    }

    if (estaInscrito && event.estado === 'en_curso') {
      if (estaVerificado) {
        Swal.fire('Verificado', 'Ya estás verificado para este evento. No puedes cancelar tu inscripción.', 'success');
      } else {
        Swal.fire('No puedes cancelar', 'El evento ya ha comenzado. Debes acreditarte o se te restarán puntos.', 'warning');
      }
      return;
    }

    if (estaInscrito) {
      // Lógica para cancelar la inscripción
      await this.cancelarInscripcion(event.id_evento);
    } else {
      // Lógica para inscribirse o unirse a la lista de espera
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

      // Actualizar estado de inscripción
      await this.loadEventDetails(eventoId);
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
