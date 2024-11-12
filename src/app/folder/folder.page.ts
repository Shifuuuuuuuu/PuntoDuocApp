import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { IonSelect, MenuController } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import {  addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { NotificationService } from '../services/notification.service';

register();

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
  isInvitado: boolean = false;
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
    private notificationService: NotificationService
  ) {}
  getPopularEvents() {
    // Filtrar eventos con más de 20 inscritos y ordenar de mayor a menor cantidad de inscritos
    this.popularEvents = this.events
      .filter(event => {
        return event.inscritos > 30;
      })
      .sort((a, b) => b.inscritos - a.inscritos)
      .slice(0, 5); // Obtener los primeros 5 eventos más populares
  }
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }


  ngOnInit() {
    // Mantén la lógica existente
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    // Verificar si el usuario está autenticado antes de cargar la página
    this.authService.getCurrentUserEmail().subscribe(emailEstudiante => {
      if (emailEstudiante) {
        this.determinarTipoUsuarioYObtenerId();
      } else {
        // Redirigir a la página de inicio de sesión si no está autenticado
        this.router.navigate(['/iniciar-sesion']);
      }
    }, error => {
      console.error('Error al verificar el usuario:', error);
      this.router.navigate(['/iniciar-sesion']);
    });

    // Agrega la suscripción al servicio de notificaciones
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }


  determinarTipoUsuarioYObtenerId() {
    this.authService.getCurrentUserEmail().subscribe(async emailEstudiante => {
      if (emailEstudiante) {
        const estudiante = await this.authService.getEstudianteByEmail(emailEstudiante);
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.isInvitado = false;
          this.loadEvents(); // Cargar eventos para el estudiante
          return;
        }
      }

      // Si no es estudiante, verificar si es invitado
      this.invitadoService.getCurrentUserEmail().subscribe(async emailInvitado => {
        if (emailInvitado) {
          const invitado = await this.invitadoService.getInvitadoByEmail(emailInvitado);
          if (invitado) {
            this.userId = invitado.id_Invitado!;
            this.isInvitado = true;
            this.loadEvents(); // Cargar eventos para el invitado
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

        if (snapshots.length === 0) {
        }

        // Mapear los snapshots para incluir el `id` del documento
        this.allEvents = snapshots.map(snapshot => {
          const eventData = snapshot.payload.doc.data() as Evento;
          const docId = snapshot.payload.doc.id; // ID del documento de Firestore

          return {
            ...eventData,
            id_evento: docId, // Utiliza el ID del documento de Firestore
            verificado: false,
            show: false,
            estaInscrito: false,
            enListaEspera: false
          };
        });

        this.filteredEvents = [...this.allEvents];
        this.events = [...this.allEvents];
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

    this.recentEvents = this.events.filter(event => {
      const eventCreationDate = this.convertToDate(event.fecha_creacion);
      return eventCreationDate >= oneWeekAgo;
    });
  }

  toggleFavorite(event: Evento) {
    event.isFavorite = !event.isFavorite;
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
      const matchesCategory = this.selectedCategory === 'all'
        ? true
        : evento.categoria?.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesSede = this.selectedSede === 'all'
        ? true
        : evento.sede?.toLowerCase() === this.selectedSede.toLowerCase();
      return matchesSearchText && matchesCategory && matchesSede;
    });
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

}
