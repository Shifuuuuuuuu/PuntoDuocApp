import { Component, OnInit } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import Swal from 'sweetalert2';
import { Capacitor } from '@capacitor/core';
import { MessagingService } from './services/messaging.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private messagingService: MessagingService) {
    this.messagingService.requestPermission();
    this.messagingService.receiveMessage();
  }

  ngOnInit() {
    // Verificar la plataforma antes de solicitar permisos y registrar notificaciones
    if (Capacitor.isNativePlatform()) {
      this.solicitarPermisosDeNotificaciones();
      this.escucharNotificaciones();
    } else {
      console.log('Las notificaciones push solo están implementadas en plataformas móviles.');
    }
  }

  async solicitarPermisosDeNotificaciones() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      console.log('Permisos de notificaciones concedidos');
      await PushNotifications.register();
    } else {
      console.error('Permisos de notificaciones denegados');
    }
  }

  escucharNotificaciones() {
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      Swal.fire({
        title: 'Nueva notificación',
        text: notification.body || 'Tienes un nuevo mensaje',
        icon: 'info',
        confirmButtonText: 'OK',
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      Swal.fire({
        title: 'Notificación abierta',
        text: `Has interactuado con una notificación: ${notification.notification.body}`,
        icon: 'info',
        confirmButtonText: 'OK',
      });
    });
  }
}
