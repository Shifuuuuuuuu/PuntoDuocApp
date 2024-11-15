import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Notificacion } from '../interface/INotificacion';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})

export class NotificationsPage implements OnInit, OnDestroy {
  currentNotifications: Notificacion[] = [];
  private messageSubscription: Subscription;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Llama a la eliminación de notificaciones caducadas al iniciar la página
    this.notificationService.eliminarNotificacionesCaducadas();

    // Configura una verificación periódica cada 24 horas para eliminar notificaciones caducadas
    setInterval(() => {
      this.notificationService.eliminarNotificacionesCaducadas();
    }, 24 * 60 * 60 * 1000);

    // Obtiene el ID del usuario actual y carga las notificaciones correspondientes
    const userId = this.getCurrentUserId();
    if (userId) {
      this.loadNotificationsFromFirestore(userId);

      // Llama a markAllAsRead() al cargar la página

      this.notificationService.markAllAsRead().then(() => {

      }).catch((error) => {
        console.error('Error al marcar las notificaciones como leídas:', error);
      });
    } else {
      console.error('No se pudo obtener el ID del usuario actual.');
    }

    // Suscripción para notificaciones de Firebase Cloud Messaging
    if (!this.messageSubscription) {
      this.messageSubscription = this.messagingService.currentMessage.subscribe((message) => {
        if (message) {
          const exists = this.currentNotifications.some(
            (notif) => notif.id === message.messageId
          );
          if (!exists) {
            const newNotification: Notificacion = {
              id: message.messageId || '',
              titulo: message.title || 'Notificación',
              descripcion: message.body || 'Sin descripción',
              fecha: new Date(),
              imagen: message.image,
              url: message.url,
              usuarioIds: []
            };
            this.notificationService.addNotification(newNotification);
            this.loadNotificationsFromFirestore(userId);
          }
        }
      });
    }
  }


  loadNotificationsFromFirestore(userId: string) {
    this.notificationService.getNotifications().subscribe(
      (notifications: Notificacion[]) => {
        this.currentNotifications = notifications.filter(notification =>
          notification.usuarioIds.some(user => user.userId === userId)
        ).map(notification => {
          if (notification.fecha && !(notification.fecha instanceof Date)) {
            if ((notification.fecha as any).seconds) {
              return {
                ...notification,
                fecha: new Date((notification.fecha as any).seconds * 1000)
              };
            }
          }
          return notification;
        });

      },
      (error) => {
        console.error('Error al cargar las notificaciones:', error);
      }
    );
  }

  getCurrentUserId(): string {
    // Implementa la lógica para obtener el ID del usuario actual (por ejemplo, desde un servicio de autenticación)
    const userId = localStorage.getItem('id');
    return userId || 'usuarioEjemploId'; // Reemplaza esto con la lógica real
  }

  openUrl(url: string) {
    window.open(url, '_blank');
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
    this.loadNotificationsFromFirestore(this.getCurrentUserId());
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
