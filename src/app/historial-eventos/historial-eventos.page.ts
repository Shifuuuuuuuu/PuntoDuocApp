import { Component, OnInit } from '@angular/core';
import { HistorialEventosService } from '../services/historial-eventos.service';

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

  constructor(private historialEventosService: HistorialEventosService) {}

  ngOnInit() {
    this.determinarTipoUsuarioYObtenerId();
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
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }
}
