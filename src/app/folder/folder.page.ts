import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Observable, Subscription, firstValueFrom} from 'rxjs';
import { Evento } from '../interface/IEventos';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { EstudianteService } from '../services/estudiante.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  selectedSede: string = 'all';
  Eventos: Observable<Evento[]> = new Observable();
  allEvents: Evento[] = [];
  filteredEvents: Evento[] = [];
  searchText: string = '';
  showFilters: boolean = false;
  folder: string = '';
  userId: string = '';
  isInvitado: boolean = false;
  loading: boolean = false;
  selectedCategory: string = 'all';
  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private estudianteService: EstudianteService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    this.authSubscription = this.authService.getCurrentUserEmail().subscribe(async (emailEstudiante) => {
      if (emailEstudiante) {
        const estudiante = await this.authService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.isInvitado = false;
          this.loadEvents();
          return;
        }
      }

      const emailInvitado = await firstValueFrom(this.invitadoService.getCurrentUserEmail());
      if (emailInvitado) {
        const invitado = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(emailInvitado));
        if (invitado) {
          this.userId = invitado.id_Invitado!;
          this.isInvitado = true;
          this.loadEvents();
          return;
        }
      }
      this.router.navigate(['/iniciar-sesion']);
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.invitadoSubscription?.unsubscribe();
  }

  async loadEvents() {
    this.loading = true;
    this.Eventos = this.firestore.collection<Evento>('Eventos').valueChanges();
    this.Eventos.subscribe(
      async (data: Evento[]) => {
        this.loading = false;
        this.allEvents = data;
        this.filteredEvents = [...this.allEvents];

        if (data.length > 0) {
          this.filteredEvents = data.filter((evento: Evento) => {
            const matchesSearchText = this.searchText
              ? evento.titulo.toLowerCase().includes(this.searchText.toLowerCase())
              : true;
            const matchesCategory = this.selectedCategory === 'all' || evento.categoria === this.selectedCategory;
            return matchesSearchText && matchesCategory;
          });

          for (let event of this.filteredEvents) {
            event.show = false;

            if (this.userId && event.id_evento) {
              try {
                event.estaInscrito = this.isInvitado
                  ? await this.eventosService.isUserRegisteredInvitado(event.id_evento, this.userId)
                  : await this.eventosService.isUserRegisteredEstudiante(event.id_evento, this.userId);
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
            }
          }
        } else {
          console.log('No se encontraron eventos en la colección.');
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener eventos de Firestore:', error);
      }
    );
  }

  filterEvents() {
    this.filteredEvents = this.allEvents.filter((evento) => {
      const matchesSearchText = this.searchText
        ? evento.titulo.toLowerCase().includes(this.searchText.toLowerCase())
        : true;
      const matchesCategory = this.selectedCategory === 'all'
        ? true
        : evento.categoria === this.selectedCategory;
      const matchesSede = this.selectedSede === 'all'
        ? true
        : evento.sede === this.selectedSede;
      return matchesSearchText && matchesCategory && matchesSede;
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
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
      try {
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

        Swal.fire({
          icon: 'success',
          title: 'Te has unido a la lista de espera.',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error al agregar a la lista de espera:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar a la lista de espera.',
        });
      }
    }
  }

  async inscribirUsuario(eventoId: string) {
    if (!this.userId) {
      const currentUser = await this.afAuth.currentUser;
      this.userId = currentUser?.uid || '';

      if (!this.userId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo encontrar el usuario autenticado.',
        });
        return;
      }
    }

    this.loading = true;
    try {
      const estaInscrito = this.isInvitado
        ? await this.eventosService.isUserRegisteredInvitado(eventoId, this.userId)
        : await this.eventosService.isUserRegisteredEstudiante(eventoId, this.userId);

      if (estaInscrito) {
        Swal.fire({
          icon: 'info',
          title: 'Ya estás inscrito en este evento.',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

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

      await this.actualizarPerfilUsuario(eventoId, 'agregar');

      Swal.fire({
        icon: 'success',
        title: 'Te has inscrito al evento correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo inscribir en el evento.',
      });
    } finally {
      setTimeout(() => {
        this.loading = false;
      }, 3000);
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
        text: 'No se pudo actualizar tu perfil. Inténtalo más tarde.',
      });
    }
  }

  async cancelarInscripcion(eventoId: string) {
    if (!this.userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo encontrar el usuario autenticado.',
      });
      return;
    }

    this.loading = true;
    try {
      const estaInscrito = this.isInvitado
        ? await this.eventosService.isUserRegisteredInvitado(eventoId, this.userId)
        : await this.eventosService.isUserRegisteredEstudiante(eventoId, this.userId);

      if (!estaInscrito) {
        Swal.fire({
          icon: 'info',
          title: 'No estás inscrito en este evento.',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      if (this.isInvitado) {
        await this.eventosService.cancelarInscripcionInvitado(eventoId, this.userId);
      } else {
        await this.eventosService.cancelarInscripcionEstudiante(eventoId, this.userId);
      }

      await this.eventosService.eliminarUsuarioDeInscripciones(eventoId, this.userId);
      await this.actualizarPerfilUsuario(eventoId, 'eliminar');

      Swal.fire({
        icon: 'success',
        title: 'Has cancelado tu inscripción correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });

      this.loadEvents();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cancelar la inscripción.',
      });
    } finally {
      this.loading = false;
    }
  }

  async salirDeListaEspera(eventoId: string) {
    if (!this.userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo encontrar el usuario autenticado.',
      });
      return;
    }

    try {
      await this.eventosService.eliminarUsuarioDeListaEspera(eventoId, this.userId);

      const evento = this.filteredEvents.find((event) => event.id_evento === eventoId);
      if (evento) {
        evento.enListaEspera = false;
      }

      Swal.fire({
        icon: 'success',
        title: 'Has salido de la lista de espera.',
        timer: 2000,
        showConfirmButton: false,
      });

      this.loadEvents();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo salir de la lista de espera. Inténtalo más tarde.',
      });
    }
  }

  toggleDescription(event: Evento) {
    event.show = !event.show;
  }
}


