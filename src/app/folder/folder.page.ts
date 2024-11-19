import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { IonSelect, MenuController, ModalController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import {  addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { NotificationService } from '../services/notification.service';
import firebase from 'firebase/compat/app';
import { MessagingService } from '../services/messaging.service';
register();
import { MissionsAlertService } from '../services/missions-alert.service';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  @ViewChild('sedeSelect', { static: false }) sedeSelect!: IonSelect;
  selectedSede: string = 'all';
  Eventos: Observable<Evento[]> = new Observable();
  allEvents: Evento[] = [];
  filteredEvents: Evento[] = [];
  searchText: string = '';
  showFilters: boolean = false;
  folder: string = '';
  userId: string = '';
  userName: string = '';
  userEmail: string = '';
  isInvitado: boolean = false;
  isStudent: boolean = false;
  loading: boolean = false;
  selectedCategory: string = 'all';
  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;
  selectedSegment = 'today';
  events: Evento[] = [];
  popularEvents: Evento[] = [];
  segmentFilteredEvents: Evento[] = []; // Eventos filtrados por segmento
  sedeFilteredEvents: Evento[] = [];
  recentEvents: Evento[] = [];
  unreadNotificationsCount: number = 0;
  eventsTerminados: Evento[] = [];
  categories = [
    { name: 'Administración y Negocios', image: 'assets/img/Administracion.png' },
    { name: 'Comunicación', image: 'assets/img/Comunicacion.png' },
    { name: 'Informática y Telecomunicaciones', image: 'assets/img/Informatica.png' },
    { name: 'Ingenería y Recursos Naturales', image: 'assets/img/Ingeneria_recursos_naturales.png' },
    { name: 'Turismo y Hospitalidad', image: 'assets/img/Turismo_hospitalidad.png' },
    { name: 'Salud', image: 'assets/img/Salud.png' },
    { name: 'Gastronomía', image: 'assets/img/Gastronomia.png' },
    { name: 'Diseño', image: 'assets/img/Diseno.png' },
    { name: 'Construcción', image: 'assets/img/Construccion.png' },
    { name: 'Deportes', image: 'assets/img/Deportes.png' },
    { name: 'Alumnos', image: 'assets/img/Alumnos.png' },
    { name: 'Biblioteca', image: 'assets/img/Biblioteca.png' },
    { name: 'Centro de Estudios', image: 'assets/img/CentroEstudio.png' },
    { name: 'Ciclo Talleres', image: 'assets/img/CicloTalleres.png' },
    { name: 'Comunidad', image: 'assets/img/Comunidad.png' },
    { name: 'Docentes', image: 'assets/img/Docentes.png' },
    { name: 'Duoc Laboral', image: 'assets/img/DuocLaboral.png' },
    { name: 'Empresas', image: 'assets/img/Empresas.png' },
    { name: 'Pastoral', image: 'assets/img/Pastoral.png' },
    { name: 'Teatro', image: 'assets/img/Teatro.png' },
    { name: 'Vida Estudiantil', image: 'assets/img/VidaEstudiantil.png' },
    { name: 'Titulados', image: 'assets/img/Titulados.png' },
    { name: 'Vive Duoc', image: 'assets/img/ViveDuoc.png' },

  ];

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private menu: MenuController,
    private notificationService: NotificationService,
    private messagingService: MessagingService,
    private missionsAlertService: MissionsAlertService
  ) {}


  openMissionsModal() {
    this.missionsAlertService.showMissionsAlert();
  }
  getPopularEvents() {
    // Filtrar eventos con más de 30 inscritos en la lista de eventos filtrados por sede
    this.popularEvents = this.sedeFilteredEvents
      .filter(event => event.inscritos > 30)
      .sort((a, b) => b.inscritos - a.inscritos)
      .slice(0, 5); // Obtener los primeros 5 eventos más populares
  }
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }


  ngOnInit() {
    this.verificarEventosTerminados();
    setInterval(() => {
      this.verificarEventosTerminados();
    }, 3600000);

    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    this.authService.getCurrentUserEmail().subscribe(emailEstudiante => {
      if (emailEstudiante) {
        this.determinarTipoUsuarioYObtenerId();
      } else {
        this.router.navigate(['/iniciar-sesion']);
      }
    }, error => {
      console.error('Error al verificar el usuario:', error);
      this.router.navigate(['/iniciar-sesion']);
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadNotificationsCount = count;
    });
  }
  // Método que se llama al hacer clic en el botón de notificaciones
  onNotificationsOpened() {
    this.notificationService.markAllAsRead();
  }

  determinarTipoUsuarioYObtenerId() {
    this.authService.getCurrentUserEmail().subscribe(async emailEstudiante => {
      if (emailEstudiante) {
        const estudiante = await this.authService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.userName = estudiante.Nombre_completo;
          this.userEmail = estudiante.email;
          this.isInvitado = false;
          this.isStudent = true; // Es estudiante
          this.loadEvents();
          return;
        }
      }

      this.invitadoService.getCurrentUserEmail().subscribe(async emailInvitado => {
        if (emailInvitado) {
          const invitado = await this.invitadoService.getInvitadoByEmail(emailInvitado);
          if (invitado) {
            this.userId = invitado.id_Invitado!;
            this.userName = invitado.Nombre_completo;
            this.userEmail = invitado.email;
            this.isInvitado = true;
            this.isStudent = false; // No es estudiante
            this.loadEvents();
            return;
          }
        } else {
          this.router.navigate(['/iniciar-sesion']);
        }
      });
    });
  }



  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.invitadoSubscription?.unsubscribe();
  }

  goToCategoryEvents(category: string) {
    this.router.navigate(['/events-category', category]);
  }
  goToEventDetails(event: Evento) {
    this.router.navigate(['/event-details', event.id_evento]); // Usa el `id_evento` del objeto `event`
  }


  async loadEvents() {
    this.loading = true;
    this.firestore.collection<Evento>('Eventos').snapshotChanges().subscribe(
      (snapshots) => {
        this.loading = false;

        this.allEvents = snapshots.map(snapshot => {
          const eventData = snapshot.payload.doc.data() as Evento;
          const docId = snapshot.payload.doc.id;

          const isFavorite = Array.isArray(eventData.favoritos) &&
            eventData.favoritos.some((fav: any) => fav.id === this.userId);

          return {
            ...eventData,
            id_evento: docId,
            verificado: false,
            isFavorite: isFavorite || false,
            show: false,
            estaInscrito: false,
            enListaEspera: false
          };
        });

        this.filteredEvents = [...this.allEvents];
        this.sedeFilteredEvents = [...this.allEvents];
        this.events = [...this.sedeFilteredEvents];

        // Filtrar eventos terminados usando la lista de eventos filtrados por sede
        this.eventsTerminados = this.sedeFilteredEvents.filter(event => event.estado === 'Terminado');

        this.filterEvents();
        this.filterEventsByDate();
        this.getPopularEvents();
        this.getRecentEvents();
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener eventos de Firestore:', error);
      }
    );
  }




  getRecentEvents() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    this.recentEvents = this.sedeFilteredEvents.filter(event => {
      const eventCreationDate = this.convertToDate(event.fecha_creacion);
      return eventCreationDate >= oneWeekAgo;
    });
  }

  async toggleFavorite(event: Evento) {
    if (!this.userName || !this.userEmail) {
        console.error('El nombre o el email del usuario no están definidos.');
        return; // Salir de la función si los datos del usuario no están completos
    }

    const userType = this.isInvitado ? 'Invitado' : 'Estudiante';
    const userFavorite = {
        id: this.userId,
        nombre: this.userName,
        email: this.userEmail,
        tipoUsuario: userType
    };

    try {
        if (!event.isFavorite) {
            event.isFavorite = true;
            await this.firestore.collection('Eventos').doc(event.id_evento).update({
                favoritos: firebase.firestore.FieldValue.arrayUnion(userFavorite)
            });
            console.log('Evento añadido a favoritos');
        } else {
            event.isFavorite = false;
            await this.firestore.collection('Eventos').doc(event.id_evento).update({
                favoritos: firebase.firestore.FieldValue.arrayRemove(userFavorite)
            });
            console.log('Evento eliminado de favoritos');
        }
    } catch (error) {
        console.error('Error al actualizar favoritos:', error);
        event.isFavorite = !event.isFavorite;
    }
}



  filterEventsByDate() {
    const today = new Date();
    switch (this.selectedSegment) {
      case 'today':
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isSameDay(this.convertToDate(event.fecha), today)
        );
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isSameDay(this.convertToDate(event.fecha), tomorrow)
        );
        break;
      case 'thisWeek':
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isWithinRange(this.convertToDate(event.fecha), startOfWeek(today), endOfWeek(today))
        );
        break;
      case 'nextWeek':
        const nextWeekStart = addDays(endOfWeek(today), 1);
        const nextWeekEnd = endOfWeek(nextWeekStart);
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isWithinRange(this.convertToDate(event.fecha), nextWeekStart, nextWeekEnd)
        );
        break;
      case 'thisMonth':
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isWithinRange(this.convertToDate(event.fecha), startOfMonth(today), endOfMonth(today))
        );
        break;
      case 'nextMonth':
        const nextMonthStart = addDays(endOfMonth(today), 1);
        const nextMonthEnd = endOfMonth(nextMonthStart);
        this.segmentFilteredEvents = this.sedeFilteredEvents.filter(event =>
          this.isWithinRange(this.convertToDate(event.fecha), nextMonthStart, nextMonthEnd)
        );
        break;
    }
  }

  segments = [
    { value: 'today', label: 'Hoy' },
    { value: 'tomorrow', label: 'Mañana' },
    { value: 'thisWeek', label: 'Esta Semana' },
    { value: 'nextWeek', label: 'Siguiente Semana' },
    { value: 'thisMonth', label: 'Este Mes' },
    { value: 'nextMonth', label: 'Siguiente Mes' }
  ];

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  onSegmentChange(value: string) {
    this.selectedSegment = value;
    this.filterEventsByDate(); // Actualiza el filtro de eventos según el segmento seleccionado
  }

  transformarFecha(fecha: any): Date | null {
    if (fecha && fecha.seconds) {
      return new Date(fecha.seconds * 1000);
    }
    return null;
  }

  customAlertOptions: any = {
    header: 'Seleccionar Sede',
    subHeader: 'Elige una sede para filtrar eventos',
    translucent: true
  };

  openSedeSelect() {
    if (this.sedeSelect) {
      this.sedeSelect.open();
    }
  }

  filterEvents() {
    this.sedeFilteredEvents = this.allEvents.filter((evento) => {
      const matchesSearchText = this.searchText
        ? evento.titulo.toLowerCase().includes(this.searchText.toLowerCase())
        : true;
      const matchesSede = this.selectedSede === 'all' || this.selectedSede === ''
        ? true
        : evento.sede?.toLowerCase() === this.selectedSede.toLowerCase();
        console.log('Selected sede:', this.selectedSede);
      return matchesSearchText && matchesSede;
    });

    // Actualiza la lista de eventos visibles
    this.segmentFilteredEvents = [...this.sedeFilteredEvents];
    console.log('Eventos filtrados:', this.sedeFilteredEvents);

    this.filterEventsByDate();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }


  convertToDate(fecha: any): Date {
    if (!fecha) return new Date();
    if (typeof fecha === 'string') return new Date(fecha);
    if (fecha.seconds) return new Date(fecha.seconds * 1000);
    return new Date();
  }
  async verificarEventosTerminados() {
    const now = new Date();

    // Obtener todos los eventos de Firestore
    this.firestore.collection<Evento>('Eventos').get().toPromise().then(snapshot => {
      if (snapshot && !snapshot.empty) {
        snapshot.docs.forEach(async doc => {
          const evento = doc.data() as Evento;
          evento.id_evento = doc.id;

          if (evento.fecha_termino && this.convertToDate(evento.fecha_termino) <= now && evento.estado !== 'Terminado') {
            console.log(`El evento "${evento.titulo}" ha terminado.`);

            // Actualizar el estado del evento a "Terminado"
            await this.firestore.collection('Eventos').doc(evento.id_evento).update({ estado: 'Terminado' });

            // Enviar notificación por Cloud Messaging y agregar a Firestore
            if (evento.Inscripciones && evento.Inscripciones.length > 0) {
              for (const inscrito of evento.Inscripciones) {
                const userId = inscrito.id_estudiante || inscrito.id_invitado;

                if (inscrito.verificado) {
                  // Notificación para usuarios verificados
                  const notificacionVerificado = {
                    id: evento.id_evento,
                    titulo: `¿Disfrutaste el evento "${evento.titulo}"?`,
                    descripcion: 'Deja tu comentario y calificación en el evento.',
                    imagen: evento.imagen || '', // Agrega la imagen del evento
                    url: `/event-details/${evento.id_evento}`,
                    fecha: new Date(),
                    usuarioIds: [{ userId, leido: false }]
                  };
                  await this.enviarNotificacion(notificacionVerificado);
                }
              }
            }
          }
        });
      } else {
        console.log('No hay eventos en la colección.');
      }
    }).catch(error => {
      console.error('Error al verificar eventos terminados:', error);
    });
  }

  async restarPuntosYNotificar(evento: Evento) {
    if (evento.Inscripciones && evento.Inscripciones.length > 0) {
      const inscritosSinVerificar = evento.Inscripciones.filter(inscrito => !inscrito.verificado);
      for (const inscrito of inscritosSinVerificar) {
        const userId = inscrito.id_estudiante || inscrito.id_invitado;

        if (userId && inscrito.id_estudiante) {
          // Restar puntos al estudiante
          const estudianteDocRef = this.firestore.collection('Estudiantes').doc(userId);
          const estudianteDoc = await estudianteDocRef.get().toPromise();
          if (estudianteDoc && estudianteDoc.exists) {
            const estudianteData = estudianteDoc.data() as { puntaje?: number };
            const nuevoPuntaje = (estudianteData.puntaje || 0) - 200;

            await estudianteDocRef.update({ puntaje: nuevoPuntaje });
            console.log(`Puntaje actualizado a ${nuevoPuntaje} para el estudiante ${userId}`);

            // Notificación al estudiante
            const notificacionEstudiante = {
              id: evento.id_evento,
              titulo: `Puntos restados por no verificar asistencia al evento "${evento.titulo}"`,
              descripcion: 'No verificaste tu asistencia y se te ha restado 200 puntos.',
              imagen: evento.imagen || '', // Agrega la imagen del evento
              fecha: new Date(),
              usuarioIds: [{ userId, leido: false }]
            };
            await this.enviarNotificacion(notificacionEstudiante);
          } else {
            console.log(`No se encontró el documento del estudiante ${userId}`);
          }
        } else if (userId && inscrito.id_invitado) {
          // Notificación al invitado
          const notificacionInvitado = {
            id: evento.id_evento,
            titulo: `Te perdiste el evento "${evento.titulo}"`,
            descripcion: 'No pudiste asistir al evento. Esperamos verte en futuros eventos.',
            imagen: evento.imagen || '', // Agrega la imagen del evento
            fecha: new Date(),
            usuarioIds: [{ userId, leido: false }]
          };
          await this.enviarNotificacion(notificacionInvitado);
        }
      }
    } else {
      console.log(`El evento "${evento.titulo}" no tiene inscripciones para verificar.`);
    }
  }

  async enviarNotificacion(notificationData: any) {
    try {
      // Agregar la notificación a Firestore
      await this.firestore.collection('Notificaciones').add(notificationData);

      // Enviar notificación por Cloud Messaging
      await this.messagingService.sendNotification(notificationData);
      console.log(`Notificación enviada a los usuarios del evento "${notificationData.titulo}"`);
    } catch (error) {
      console.error('Error al enviar la notificación:', error);
    }
  }
}
