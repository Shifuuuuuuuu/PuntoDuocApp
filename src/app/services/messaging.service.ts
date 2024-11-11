import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';
@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  currentMessage = new BehaviorSubject<any>(null);

  constructor(
    private afMessaging: AngularFireMessaging,
    private notificationService: NotificationService
  ) {}

  requestPermission() {
    this.afMessaging.requestToken.pipe(take(1)).subscribe(
      (token) => {
        console.log('Token FCM:', token);
      },
      (error) => {
        console.error('Error al obtener el token FCM:', error);
      }
    );
  }

  listenForMessages() {
    this.afMessaging.messages.subscribe(
      (message: any) => {
        console.log('Mensaje recibido en primer plano:', message);

        // Extraer y manejar la notificación
        if (message.notification) {
          const notification = {
            title: message.notification.title || 'Sin título',
            body: message.notification.body || 'Sin contenido',
            isRead: false,
            timestamp: new Date()
          };

          // Agrega la notificación al servicio de notificaciones
          this.notificationService.addNotification(notification);
          this.currentMessage.next(notification); // Pasa el objeto de notificación a currentMessage
        }
      },
      (error) => {
        console.error('Error al recibir el mensaje:', error);
      }
    );
  }
}
