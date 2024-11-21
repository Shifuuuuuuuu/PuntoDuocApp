import { Component, OnInit } from '@angular/core';
import { HistorialEventosService } from '../services/historial-eventos.service';
import { NotificationService } from '../services/notification.service';
import { MissionsAlertService } from '../services/missions-alert.service';
import { Timestamp } from 'firebase/firestore';

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
            if (evento.fechaVerificacion instanceof Timestamp) {
              evento.fechaVerificacion = evento.fechaVerificacion.toDate();
            }
            if (evento.fecha_termino instanceof Timestamp) {
              evento.fecha_termino = evento.fecha_termino.toDate();
            }
          });

          this.eventosAcreditados = eventos.filter(evento => evento.estadoVerificacion === 'Acreditado');
          this.eventosNoAcreditados = eventos.filter(evento => evento.estadoVerificacion === 'No Acreditado');
          this.eventosPenalizados = eventos.filter(evento => evento.estadoVerificacion === 'Penalizado');
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
