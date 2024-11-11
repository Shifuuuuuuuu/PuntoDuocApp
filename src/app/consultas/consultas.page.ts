import { Component, OnInit } from '@angular/core';
import { InvitadoService } from '../services/invitado.service';
import { ConsultaService } from '../services/consulta.service';
import { EstudianteService } from '../services/estudiante.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { MenuController } from '@ionic/angular';
import { NotificationService } from '../services/notification.service';
@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.page.html',
  styleUrls: ['./consultas.page.scss'],
})
export class ConsultasPage implements OnInit {
  consulta = {
    motivo: '',
    mensaje: '',
    nombre: '',
    correo: ''
  };
  unreadNotificationsCount: number = 0;
  constructor(
    private consultaService: ConsultaService,
    private estudianteService: EstudianteService,
    private invitadoService: InvitadoService,
    private menu: MenuController,
    private notificationService: NotificationService
  ) {
    this.obtenerUsuario();
  }
  ngOnInit() {
    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }

  async obtenerUsuario() {
    try {
      const userId = await firstValueFrom(this.estudianteService.getUserId());

      if (userId) {
        const estudiante = await firstValueFrom(this.estudianteService.getUserById(userId));
        if (estudiante) {
          this.consulta.nombre = estudiante.Nombre_completo;
          this.consulta.correo = estudiante.email;
        } else {
          const invitado = await firstValueFrom(this.invitadoService.getUserById(userId));
          if (invitado) {
            this.consulta.nombre = invitado.Nombre_completo;
            this.consulta.correo = invitado.email;
          } else {
            console.log('Usuario no encontrado en ambas colecciones.');
          }
        }
      } else {
        console.log('No se obtuvo ningún User ID.');
      }
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
    }
  }

  async enviarConsulta() {
    if (!this.consulta.nombre || !this.consulta.correo) {
      this.showAlert('Error', 'No se ha podido obtener la información del usuario.', 'error');
      return;
    }

    try {
      await this.consultaService.enviarConsulta(this.consulta);
      this.showAlert('Consulta enviada', 'Tu consulta ha sido enviada con éxito.', 'success');
      this.consulta.motivo = '';
      this.consulta.mensaje = '';
    } catch (error) {
      this.showAlert('Error', 'Ocurrió un error al enviar la consulta.', 'error');
    }
  }

  showAlert(title: string, text: string, icon: 'success' | 'error') {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK'
    });
  }
}
