import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Notificacion } from '../interface/INotificacion';
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
  currentNotifications: Notificacion[] = []; // Usa la interfaz Notificacion
  private messageSubscription: Subscription;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadNotificationsFromFirestore();

    // Suscripción para notificaciones de Firebase Cloud Messaging
    if (!this.messageSubscription) {
      this.messageSubscription = this.messagingService.currentMessage.subscribe((message) => {
        if (message) {
          console.log('Notificación recibida en primer plano:', message);

          // Verifica si la notificación ya existe en la lista
          const exists = this.currentNotifications.some(
            (notif) => notif.id === message.messageId
          );
          if (!exists) {
            // Crea un objeto de notificación y añade la fecha actual
            const newNotification: Notificacion = {
              id: message.messageId || '', // ID de la notificación (puedes ajustar esto según el mensaje recibido)
              titulo: message.title || 'Notificación',
              descripcion: message.body || 'Sin descripción',
              fecha: new Date(), // Usa la fecha actual
              imagen: message.image, // Asigna la imagen si existe
              url: message.url // Asigna la URL si existe
            };

            // Añade la notificación a Firestore
            this.notificationService.addNotification(newNotification);

            // Carga las notificaciones nuevamente
            this.loadNotificationsFromFirestore();
          }
        }
      });
    }
  }

  loadNotificationsFromFirestore() {
    this.notificationService.getNotifications().subscribe((notifications: any[]) => {
      this.currentNotifications = notifications;
    });
  }
  openUrl(url: string) {
    window.open(url, '_blank');
  }


  markAllAsRead() {
    this.notificationService.markAllAsRead();
    this.loadNotificationsFromFirestore(); // Actualiza la vista para reflejar el cambio
  }

  ngOnDestroy() {
    // Desuscribirse para evitar fugas de memoria
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
