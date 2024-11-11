import { Component, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
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

export class NotificationsPage implements OnInit {
  currentNotifications: any[] = []; // Array para almacenar las notificaciones recibidas
  unreadNotificationsCount: number = 0; // Contador de notificaciones no leídas

  constructor(private messagingService: MessagingService) {}

  ngOnInit() {
    this.messagingService.requestPermission();
    this.messagingService.listenForMessages();
    this.messagingService.currentMessage.subscribe((message) => {
      if (message) {
        console.log('Mensaje recibido en primer plano:', message);
        this.currentNotifications.unshift(message);
        this.unreadNotificationsCount++; // Incrementa el contador
      }
    });
  }

  // Método para marcar todas las notificaciones como leídas
  markAllAsRead() {
    this.unreadNotificationsCount = 0;
  }
}

