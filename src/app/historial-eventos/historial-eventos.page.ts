import { Component, OnInit } from '@angular/core';
import { HistorialEventosService } from '../services/historial-eventos.service';
import { NotificationService } from '../services/notification.service';
import { MissionsAlertService } from '../services/missions-alert.service';
import { Timestamp } from 'firebase/firestore';
import { Inscripcion } from '../interface/IInscripcion';

@Component({
  selector: 'app-historial-eventos',
  templateUrl: './historial-eventos.page.html',
  styleUrls: ['./historial-eventos.page.scss'],
})
export class HistorialEventosPage implements OnInit {
  userId: string = '';
  userType: 'estudiante' | 'invitado' | null = null;
  loading: boolean = true;
  unreadNotificationsCount: number = 0;
  eventosAcreditados: any[] = [];
  eventosNoAcreditados: any[] = [];
  eventosPenalizados: any[] = [];

  constructor(
    private historialEventosService: HistorialEventosService,
    private notificationService: NotificationService,
    private missionsAlertService: MissionsAlertService
  ) {}

  ngOnInit() {
    this.determinarTipoUsuarioYObtenerId();
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

  openMissionsModal() {
    this.missionsAlertService.showMissionsAlert();
  }

  determinarTipoUsuarioYObtenerId() {
    const storedUserType = localStorage.getItem('userType');
    const storedUserId = localStorage.getItem('id');

    if (storedUserType && storedUserId) {
      this.userType = storedUserType as 'estudiante' | 'invitado';
      this.userId = storedUserId;
      this.loadEventosVerificados();
    } else {
      console.warn('No se pudo obtener el tipo de usuario o el ID. Redirigiendo al inicio de sesión.');
    }
  }

  loadEventosVerificados() {
    if (this.userId && this.userType) {
      this.historialEventosService.getEventosVerificados(this.userId, this.userType).subscribe(
        (eventos) => {
          eventos.forEach(evento => {
            // Convertir fechas de evento
            if (evento.fecha && 'seconds' in evento.fecha) {
              evento.fecha = new Date(evento.fecha.seconds * 1000);
            }
            if (evento.fecha_termino && 'seconds' in evento.fecha_termino) {
              evento.fecha_termino = new Date(evento.fecha_termino.seconds * 1000);
            }

            // Convertir fechas en inscripciones
            if (evento.Inscripciones && evento.Inscripciones.length > 0) {
              evento.Inscripciones.forEach((inscripcion: Inscripcion) => {
                if (inscripcion.fechaVerificacion instanceof Timestamp) {
                  inscripcion.fechaVerificacion = inscripcion.fechaVerificacion.toDate();
                }
              });
            }
          });

          // Clasificar los eventos según las inscripciones
          this.eventosAcreditados = eventos.filter(evento =>
            evento?.Inscripciones?.some((inscripcion: Inscripcion) => inscripcion.verificado)
          );

          this.eventosNoAcreditados = eventos.filter(evento =>
            evento?.Inscripciones?.some((inscripcion: Inscripcion) => !inscripcion.verificado)
          );

          this.eventosPenalizados = eventos.filter(evento =>
            evento?.Inscripciones?.some((inscripcion: Inscripcion) => inscripcion.puntaje === 0)
          );

          this.loading = false;
        },
        (error) => {
          console.error('Error al cargar eventos verificados:', error);
          this.loading = false;
        }
      );
    } else {
      console.warn('No se pudo cargar eventos verificados debido a la falta de ID o tipo de usuario.');
      this.loading = false;
    }
  }



}
