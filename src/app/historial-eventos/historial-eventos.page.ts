import { Component, OnInit } from '@angular/core';
import { HistorialEventosService } from '../services/historial-eventos.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-historial-eventos',
  templateUrl: './historial-eventos.page.html',
  styleUrls: ['./historial-eventos.page.scss'],
})
export class HistorialEventosPage implements OnInit {
  userId: string = '';
  userType: 'estudiante' | 'invitado' | null = null;
  eventosVerificados: any[] = [];
  loading: boolean = true;
  unreadNotificationsCount: number = 0;

  constructor(private historialEventosService: HistorialEventosService,private notificationService: NotificationService) {}

  ngOnInit() {
    this.determinarTipoUsuarioYObtenerId();
    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

  determinarTipoUsuarioYObtenerId() {
    // Obtener el tipo de usuario y el ID almacenados en localStorage
    const storedUserType = localStorage.getItem('userType');
    const storedUserId = localStorage.getItem('id');

    if (storedUserType && storedUserId) {
      this.userType = storedUserType as 'estudiante' | 'invitado';
      this.userId = storedUserId;

      // Cargar eventos verificados después de obtener el tipo y el ID
      this.loadEventosVerificados();
    } else {
      console.warn('No se pudo obtener el tipo de usuario o el ID. Redirigiendo al inicio de sesión.');
    }
  }

  loadEventosVerificados() {
    if (this.userId && this.userType) {
      this.historialEventosService.getEventosVerificados(this.userId, this.userType).subscribe(eventos => {
        this.eventosVerificados = eventos;
        this.loading = false;
      }, error => {
        console.error('Error al cargar eventos verificados:', error);
        this.loading = false;
      });
    } else {
      console.warn('No se pudo cargar eventos verificados debido a la falta de ID o tipo de usuario.');
      this.loading = false;
    }
  }

}
