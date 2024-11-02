import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { IonSelect } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import {  addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
  segmentFilteredEvents: Evento[] = []; // Eventos filtrados por segmento
  sedeFilteredEvents: Evento[] = [];
  categories = [
    { name: 'Administración y Negocios', image: 'assets/img/Administracion.png' },
    { name: 'Comunicación', image: 'assets/img/Comunicacion.png' },
    { name: 'Informática y Telecomunicaciones', image: 'assets/img/Informatica.png' },
    { name: 'Ingenería y Recursos Naturales', image: 'assets/img/Ingeneria_recursos_naturales.png' },
    { name: 'Turismo y Hospitalidad', image: 'assets/img/Turismo_hospitalidad.png' },
    { name: 'Salud', image: 'assets/img/Salud.png' },
    { name: 'Gastronomía', image: 'assets/img/Gastronomia.png' },
    { name: 'Diseño', image: 'assets/img/Diseno.png' },
    { name: 'Construcción', image: 'assets/img/Construccion.png' }
  ];

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
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

      const emailInvitado = await this.invitadoService.getCurrentUserEmail().toPromise();
      if (emailInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorEmail(emailInvitado).toPromise();
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

  goToCategoryEvents(category: string) {
    this.router.navigate(['/events-category', category]);
  }

  async loadEvents() {
    this.loading = true;
    this.Eventos = this.firestore.collection<Evento>('Eventos').valueChanges();
    this.Eventos.subscribe(
      async (data: Evento[]) => {
        this.loading = false;

        const eventosConVerificado = data.map(evento => {
          const eventoConVerificado = { ...evento, verificado: false };
          return eventoConVerificado;
        });

        this.allEvents = eventosConVerificado;
        this.filteredEvents = [...eventosConVerificado];
        this.events = [...eventosConVerificado];

        if (data.length > 0) {
          this.filteredEvents = eventosConVerificado.filter((evento) => {
            const matchesSearchText = this.searchText
              ? evento.titulo.toLowerCase().includes(this.searchText.toLowerCase())
              : true;
            const matchesCategory = this.selectedCategory === 'all' || evento.categoria === this.selectedCategory;
            return matchesSearchText && matchesCategory;
          });

          for (let event of this.filteredEvents) {
            event.show = false;

            if (this.userId && event.id_evento) {
              const usuarioId = this.isInvitado ? 'id_invitado' : 'id_estudiante';

              const usuarioInscripcion = event.Inscripciones?.find(
                (inscripcion) => inscripcion[usuarioId] === this.userId
              );
              event.estaInscrito = !!usuarioInscripcion;
              event.verificado = usuarioInscripcion?.verificado === true;

              try {
                event.enListaEspera = await this.eventosService.isUserInWaitList(event.id_evento, this.userId);
              } catch (error) {
                console.error('Error al verificar lista de espera:', error);
                event.enListaEspera = false;
              }
            }
          }

          this.filterEvents();
          this.filterEventsByDate();
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
  toggleFavorite(event: Evento) {
    event.isFavorite = !event.isFavorite;
  }
  goToEventDetails(event: Evento) {
    this.router.navigate(['/event-details', event.id_evento]);
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

  toggleDescription(event: Evento) {
    event.show = !event.show;
  }

  convertToDate(fecha: string | { seconds: number; nanoseconds: number }): Date {
    if (typeof fecha === 'string') {
      return new Date(fecha);
    } else {
      return new Date(fecha.seconds * 1000);
    }
  }
}
