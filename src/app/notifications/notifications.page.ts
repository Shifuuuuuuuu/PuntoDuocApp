import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Notificacion } from '../interface/INotificacion';
import { NotificacionesDirectas } from '../services/messaging.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit, OnDestroy {
  currentNotifications: Notificacion[] = [];
  directNotifications: NotificacionesDirectas[] = [];
  private messageSubscription: Subscription;
  private hiddenNotificationIds: string[] = [];

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.hiddenNotificationIds = this.getHiddenNotificationIds();

    const userId = this.getCurrentUserId();
    if (userId) {
      this.loadNotificationsFromFirestore(userId);
      this.loadDirectNotifications(userId);

      if (!this.messageSubscription) {
        this.messageSubscription = this.messagingService.currentMessage.subscribe((message) => {
          if (message) {
            const newNotification: Notificacion = {
              id: message.messageId || '',
              titulo: message.title || 'Notificación',
              descripcion: message.body || 'Sin descripción',
              fecha: new Date(),
              imagen: message.image,
              url: message.url,
              usuarioIds: [],
            };
            this.notificationService.addNotification(newNotification);
            this.loadNotificationsFromFirestore(userId);
          }
        });
      }
    } else {
      console.error('No se pudo obtener el ID del usuario actual.');
    }
  }

  getCurrentUserId(): string {
    return localStorage.getItem('id') || 'usuarioEjemploId';
  }


  loadNotificationsFromFirestore(userId: string) {
    this.notificationService.getNotifications().subscribe(
      (notifications: Notificacion[]) => {
        this.currentNotifications = notifications.filter(
          (notif) =>
            notif.usuarioIds.some((user) => user.userId === userId) &&
            !this.hiddenNotificationIds.includes(notif.id)
        );
      },
      (error) => {
        console.error('Error al cargar las notificaciones:', error);
      }
    );
  }

  loadDirectNotifications(userId: string) {
    this.messagingService.getDirectNotifications(userId).subscribe(
      (directNotifications) => {
        this.directNotifications = directNotifications;
        console.log('Notificaciones directas cargadas:', directNotifications);
      },
      (error) => {
        console.error('Error al cargar las notificaciones directas:', error);
      }
    );
  }
  
  ocultarNotificacion(notificacionId: string) {
    this.currentNotifications = this.currentNotifications.filter(
      (notif) => notif.id !== notificacionId
    );
    this.hiddenNotificationIds.push(notificacionId);
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
  openUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
  
}
