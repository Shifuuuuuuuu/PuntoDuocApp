import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Observable, Subscription, lastValueFrom } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { EstudianteService } from '../services/estudiante.service';
@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  Eventos: Observable<Evento[]> = new Observable();
  filteredEvents: Evento[] = [];
  searchText: string = '';
  showFilters: boolean = false;
  folder: string = '';
  userId: string = ''; // ID del usuario autenticado
  isInvitado: boolean = false; // Indicador para saber si el usuario es un invitado
  loading: boolean = false;
  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private estudianteService: EstudianteService
  ) {}

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    // Suscribirse al observable de AuthService para Estudiantes
    this.authSubscription = this.authService.getCurrentUserEmail().subscribe(async (emailEstudiante) => {
      if (emailEstudiante) {
        console.log('Usuario Estudiante autenticado con email:', emailEstudiante);
        const estudiante = await this.authService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.isInvitado = false;
          this.loadEvents();
          return;
        }
      }

      // Si no es Estudiante, suscribirse a InvitadoService para Invitados
      this.invitadoSubscription = this.invitadoService.getCurrentUserEmail().subscribe(async (emailInvitado) => {
        if (emailInvitado) {
          console.log('Usuario Invitado autenticado con email:', emailInvitado);
          const invitado = await this.invitadoService.obtenerInvitadoPorEmail(emailInvitado);
          if (invitado) {
            this.userId = invitado.id_Invitado!;
            this.isInvitado = true;
            this.loadEvents();
            return;
          }
        }

        // Si no se encuentra ningún usuario autenticado
        console.error('No hay un usuario autenticado');
        this.router.navigate(['/iniciar-sesion']);
      });
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.invitadoSubscription) {
      this.invitadoSubscription.unsubscribe();
    }
  }


  async loadEvents() {
    this.loading = true; // Mostrar pantalla de carga
    this.Eventos = this.firestore.collection<Evento>('Eventos').valueChanges();
    this.Eventos.subscribe(
      async (data) => {
        this.loading = false; // Ocultar pantalla de carga
        console.log('Eventos obtenidos:', data);

        if (data && data.length > 0) {
          this.filteredEvents = data;
          for (let event of this.filteredEvents) {
            event.show = false;

            if (this.userId && event.id_evento) {
              try {
                event.estaInscrito = await this.eventosService.isUserRegistered(event.id_evento, this.userId);
              } catch (error) {
                console.error('Error al verificar inscripción:', error);
                event.estaInscrito = false;
              }

              try {
                event.enListaEspera = await this.eventosService.isUserInWaitList(event.id_evento, this.userId);
              } catch (error) {
                console.error('Error al verificar lista de espera:', error);
                event.enListaEspera = false;
              }
            } else {
              console.warn(`No se pudo verificar inscripción para el evento ${event.id_evento}. userId o id_evento no definidos.`);
            }
          }
        } else {
          console.log('No se encontraron eventos en la colección.');
        }
      },
      (error) => {
        this.loading = false; // Ocultar pantalla de carga
        console.error('Error al obtener eventos de Firestore:', error);
      }
    );
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  filterEvents() {
    this.filteredEvents = this.Eventos
      ? this.filteredEvents.filter((evento) => evento.titulo.toLowerCase().includes(this.searchText.toLowerCase()))
      : [];
  }


  async presentAlert(event: Evento) {
    const alert = await this.alertController.create({
      header: '¿Quieres inscribirte al evento?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí',
          handler: () => {
            // Verificar si hay cupos disponibles
            if (event.Cupos > 0) {
              this.inscribirUsuario(event.id_evento);
            } else {
              // Si no hay cupos, preguntar si quiere estar en lista de espera
              this.presentWaitListAlert(event);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async presentWaitListAlert(event: Evento) {
    const alert = await this.alertController.create({
      header: 'El evento está lleno',
      message: '¿Te gustaría estar en la lista de espera?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí',
          handler: async () => {
            try {
              // Obtener el nombre del usuario dependiendo de si es Invitado o Estudiante
              let userName = '';
              if (this.isInvitado) {
                const invitado = await this.invitadoService.obtenerInvitadoPorId(this.userId);
                if (invitado) {
                  userName = invitado.Nombre_completo || 'Invitado';
                }
              } else {
                const estudiante = await this.estudianteService.obtenerEstudiantePorId(this.userId);
                if (estudiante) {
                  userName = estudiante.Nombre_completo || 'Estudiante';
                }
              }

              // Añadir al usuario a la lista de espera usando el ID y nombre
              await this.eventosService.agregarUsuarioAListaEspera(event.id_evento, this.userId, userName);

              // Actualiza la propiedad del evento
              event.enListaEspera = true;

              // Mostrar un toast de confirmación
              const toast = await this.toastController.create({
                message: 'Te has unido a la lista de espera.',
                duration: 2000,
                position: 'top',
                color: 'warning',
              });
              await toast.present();
            } catch (error) {
              console.error('Error al agregar a la lista de espera:', error);
              const errorMessage = (error as Error).message || 'No se pudo agregar a la lista de espera. Inténtalo más tarde.';
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: errorMessage,
                buttons: ['OK'],
              });
              await errorAlert.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // Método para manejar la inscripción desde la lista de espera
  async inscribirDesdeListaEspera(eventoId: string, userId: string) {
    try {
      // Aquí obtienes el nombre del usuario.
      let userName = await this.obtenerNombreUsuario(userId);

      if (!userName) {
        userName = 'Invitado'; // Valor predeterminado
      }

      await this.eventosService.inscribirDesdeListaEspera(eventoId, { userId, userName });
      await this.actualizarPerfilUsuario(eventoId, 'agregar');

      const alert = await this.alertController.create({
        header: 'Inscripción exitosa',
        message: 'Has sido inscrito al evento desde la lista de espera.',
        buttons: ['OK'],
      });
      await alert.present();
      this.router.navigate(['/perfil-usuario']);
    } catch (error) {
      console.error('Error al inscribir desde la lista de espera:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo inscribir al evento. Inténtalo más tarde.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  // Este método obtiene el nombre del usuario
  async obtenerNombreUsuario(userId: string): Promise<string> {
    try {
      // Usa lastValueFrom para convertir el Observable a una Promesa y obtener el valor
      const usuario: any = await lastValueFrom(this.estudianteService.getUserById(userId));
      return usuario ? usuario.nombre : null; // Devuelve el nombre si existe
    } catch (error) {
      console.error('Error al obtener el nombre del usuario:', error);
      return ''; // En caso de error, devuelve null
    }
  }


  // Método para verificar cupos y gestionar la lista de espera
  async verificarListaEspera(eventoId: string) {
    try {
      await this.eventosService.verificarListaEspera(eventoId);
      // Recarga los eventos para reflejar los cambios
      this.loadEvents();
    } catch (error) {
      console.error('Error al verificar la lista de espera:', error);
    }
  }

  async inscribirUsuario(eventoId: string) {
    if (!this.userId) {
      console.error('El ID del usuario no está disponible.');
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo encontrar el usuario autenticado.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.loading = true; // Mostrar pantalla de carga
    try {
      const estaInscrito = await this.eventosService.isUserRegistered(eventoId, this.userId);
      if (estaInscrito) {
        const toast = await this.toastController.create({
          message: 'Ya estás inscrito en este evento.',
          duration: 2000,
          position: 'top',
          color: 'warning',
        });
        await toast.present();
        return;
      }

      await this.eventosService.inscribirUsuario(eventoId, this.userId);
      await this.actualizarPerfilUsuario(eventoId, 'agregar');

      const toast = await this.toastController.create({
        message: 'Te has inscrito al evento correctamente.',
        duration: 2000,
        position: 'top',
        color: 'success',
      });
      await toast.present();

      this.router.navigate(['/perfil-usuario']);
    } catch (error) {
      console.error((error as Error).message);
      const alert = await this.alertController.create({
        header: 'Error',
        message: (error as Error).message,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false; // Ocultar pantalla de carga
    }
  }

  // Método para cancelar inscripción
  async cancelarInscripcion(eventoId: string) {
    if (!this.userId) {
      console.error('El ID del usuario no está disponible.');
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo encontrar el usuario autenticado.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    this.loading = true; // Mostrar pantalla de carga
    try {
      const estaInscrito = await this.eventosService.isUserRegistered(eventoId, this.userId);
      if (!estaInscrito) {
        const toast = await this.toastController.create({
          message: 'No estás inscrito en este evento.',
          duration: 2000,
          position: 'top',
          color: 'warning',
        });
        await toast.present();
        return;
      }

      await this.eventosService.cancelarInscripcion(eventoId, this.userId);
      await this.actualizarPerfilUsuario(eventoId, 'eliminar');

      const toast = await this.toastController.create({
        message: 'Has cancelado tu inscripción correctamente.',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      await toast.present();

      this.loadEvents();
    } catch (error) {
      console.error((error as Error).message);
      const alert = await this.alertController.create({
        header: 'Error',
        message: (error as Error).message,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.loading = false; // Ocultar pantalla de carga
    }
  }

  // Método para salirse de la lista de espera
  async salirDeListaEspera(eventoId: string) {
    if (!this.userId) {
      console.error('El ID del usuario no está disponible.');
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo encontrar el usuario autenticado.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    try {
      // Obtener el nombre del usuario dependiendo de si es Invitado o Estudiante
      let userName = '';
      if (this.isInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorId(this.userId);
        if (invitado) {
          userName = invitado.Nombre_completo || 'Invitado';
        }
      } else {
        const estudiante = await this.estudianteService.obtenerEstudiantePorId(this.userId);
        if (estudiante) {
          userName = estudiante.Nombre_completo || 'Estudiante';
        }
      }

      // Eliminar al usuario de la lista de espera usando el ID y nombre
      await this.eventosService.eliminarUsuarioDeListaEspera(eventoId, this.userId, userName);

      // Actualiza la propiedad del evento
      const evento = this.filteredEvents.find((event) => event.id_evento === eventoId);
      if (evento) {
        evento.enListaEspera = false;
      }

      const toast = await this.toastController.create({
        message: 'Has salido de la lista de espera.',
        duration: 2000,
        position: 'top',
        color: 'warning',
      });
      await toast.present();

      // Recarga los eventos para reflejar el cambio
      this.loadEvents();
    } catch (error) {
      console.error('Error al salir de la lista de espera:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo salir de la lista de espera. Inténtalo más tarde.',
        buttons: ['OK'],
      });
      await alert.present();
    }
  }


  // Método para actualizar el perfil del usuario
  async actualizarPerfilUsuario(eventoId: string, accion: 'agregar' | 'eliminar') {
    try {
      if (this.isInvitado) {
        // Actualizar invitado
        if (accion === 'agregar') {
          await this.invitadoService.agregarEventoAInvitado(this.userId, eventoId);
        } else {
          await this.invitadoService.eliminarEventoDeInvitado(this.userId, eventoId);
        }
      } else {
        // Actualizar estudiante
        if (accion === 'agregar') {
          await this.estudianteService.agregarEventoAEstudiante(this.userId, eventoId);
        } else {
          await this.estudianteService.eliminarEventoDeEstudiante(this.userId, eventoId);
        }
      }
    } catch (error) {
      console.error('Error al actualizar el perfil del usuario:', error);
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar tu perfil. Inténtalo más tarde.',
        duration: 2000,
        position: 'top',
        color: 'danger',
      });
      await toast.present();
    }
  }

  toggleDescription(event: Evento) {
    event.show = !event.show;
  }
}




