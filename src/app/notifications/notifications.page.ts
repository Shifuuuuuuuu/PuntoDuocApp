import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
interface Notification {
  title: string;
  body: string;
  timestamp: Date; // Incluye la propiedad timestamp en la interfaz
}
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})

export class NotificationsPage implements OnInit, OnDestroy {
  currentNotifications: any[] = [];
  private messageSubscription: Subscription;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadNotifications();

    // Evitar suscripciones múltiples
    if (!this.messageSubscription) {
      this.messageSubscription = this.messagingService.currentMessage.subscribe((message) => {
        if (message) {
          console.log('Notificación recibida en primer plano:', message);

          // Verifica si la notificación ya existe
          const exists = this.currentNotifications.some(
            (notif) => notif.messageId === message.messageId
          );
          if (!exists) {
            this.notificationService.addNotification(message);
            this.loadNotifications(); // Recargar las notificaciones en la vista
          }
        }
      });
    }
  }

  loadNotifications() {
    this.currentNotifications = this.notificationService.getNotifications();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
    this.loadNotifications(); // Actualiza la vista para reflejar el cambio
  }

  ngOnDestroy() {
    // Desuscribirse para evitar fugas de memoria
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
