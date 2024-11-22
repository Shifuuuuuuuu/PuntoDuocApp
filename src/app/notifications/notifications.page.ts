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
  private hiddenNotificationIds: string[] = []; // Lista de IDs ocultos
  private messageSubscription: Subscription;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.hiddenNotificationIds = this.getHiddenNotificationIds();

    this.notificationService.eliminarNotificacionesCaducadas();

    setInterval(() => {
      this.notificationService.eliminarNotificacionesCaducadas();
    }, 24 * 60 * 60 * 1000);

    const userId = this.getCurrentUserId();
    if (userId) {
      this.loadNotificationsFromFirestore(userId);

      this.notificationService.markAllAsRead().catch((error) => {
        console.error('Error al marcar las notificaciones como leídas:', error);
      });
    } else {
      console.error('No se pudo obtener el ID del usuario actual.');
    }

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
        this.currentNotifications = notifications
          .filter(notification =>
            notification.usuarioIds.some(user => user.userId === userId) &&
            !this.hiddenNotificationIds.includes(notification.id) // Excluir las ocultas
          )
          .map(notification => {
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
    const userId = localStorage.getItem('id');
    return userId || 'usuarioEjemploId';
  }

  openUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  ocultarNotificacion(notificacionId: string) {
    this.currentNotifications = this.currentNotifications.filter(
      (notif) => notif.id !== notificacionId
    );
    this.hiddenNotificationIds.push(notificacionId); // Agregar el ID a la lista de ocultos
    this.saveHiddenNotificationIds();
  }

  getHiddenNotificationIds(): string[] {
    const ids = localStorage.getItem('hiddenNotifications');
    return ids ? JSON.parse(ids) : [];
  }

  saveHiddenNotificationIds() {
    localStorage.setItem('hiddenNotifications', JSON.stringify(this.hiddenNotificationIds));
  }

  ngOnDestroy() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
