import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { Notificacion } from '../interface/INotificacion';
import { NotificacionesDirectas } from '../services/messaging.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit, OnDestroy {
  currentNotifications: Notificacion[] = [];
  directNotifications: NotificacionesDirectas[] = [];
  private hiddenNotificationIds: string[] = []; // Lista de IDs ocultos
  private messageSubscription: Subscription;
  private firestore: AngularFirestore;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.hiddenNotificationIds = this.getHiddenNotificationIds();

    const userId = this.getCurrentUserId();


    if (userId) {
      // Llamar al método de corrección automática de notificaciones directas
      this.messagingService
        .corregirNotificacionesDirectas(userId)
        .then(() => {
          // Cargar las notificaciones después de corregir
          this.loadNotificationsFromFirestore(userId);
          this.loadDirectNotifications(userId);
        })
        .catch((error) => console.error('Error en la corrección automática de notificaciones:', error));

      // Cargar notificaciones regulares
      this.loadNotificationsFromFirestore(userId);
      this.loadDirectNotifications(userId);

      // Marcar todas las notificaciones como leídas
      this.notificationService.markAllAsRead().catch((error) => {
        console.error('Error al marcar las notificaciones como leídas:', error);
      });

      // Suscripción a mensajes nuevos
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
                usuarioIds: [],
              };
              this.notificationService.addNotification(newNotification);
              this.loadNotificationsFromFirestore(userId);
            }
          }
        });
      }
    } else {
      console.error('No se pudo obtener el ID del usuario actual.');
    }
  }


  async markDirectNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // Llamar al servicio para actualizar el estado de la notificación
      await this.messagingService.updateNotificationReadStatus(notificationId);
      console.log(`Notificación ${notificationId} marcada como leída.`);
    } catch (error) {
      console.error('Error al marcar la notificación como leída', error);
    }
  } 
  

  getCurrentUserId(): string {
    return localStorage.getItem('id') || 'usuarioEjemploId';
  }

  loadNotificationsFromFirestore(userId: string) {
    this.notificationService.getNotifications().subscribe(
      (notifications: Notificacion[]) => {
        this.currentNotifications = notifications
          .filter(
            (notif) =>
              Array.isArray(notif.usuarioIds) && // Asegúrate de que usuarioIds es un array
              notif.usuarioIds.some((user) => user.userId === userId) &&
              !this.hiddenNotificationIds.includes(notif.id)
          )
          .map((notif) => ({
            ...notif,
            fecha: notif.fecha instanceof Date
              ? notif.fecha
              : notif.fecha
              ? new Date((notif.fecha as any).seconds * 1000) // Convertir Timestamp a Date
              : undefined,
            fechaTermino: notif.fechaTermino instanceof Date
              ? notif.fechaTermino
              : notif.fechaTermino
              ? new Date((notif.fechaTermino as any).seconds * 1000)
              : undefined,
          }));
      },
      (error) => {
        console.error('Error al cargar las notificaciones:', error);
      }
    );
  }

  loadDirectNotifications(userId: string) {
    const userType = localStorage.getItem('userType') || 'defaultUserType';  // Obtenemos el userType
  
    console.log('userType:', userType);
    this.messagingService.getDirectNotifications().subscribe(  // Pasamos userType aquí
      async (directNotifications) => {
        // Filtrar notificaciones asociadas al usuario actual
        this.directNotifications = directNotifications.filter((notif) =>
          Array.isArray(notif.usuarioIds) && notif.usuarioIds.some((user) => user.userId === userId)
        );
  
        // Ya no marcamos automáticamente las notificaciones como leídas aquí
        // Esto se hará solo cuando el usuario haga clic en la X de la notificación.
      },
      (error) => {
        console.error('Error al cargar las notificaciones directas:', error);
      }
    );
  }
  
  // Función para marcar como leída una notificación cuando se hace clic en la X
  async markNotificationAsRead(notificationId: string, userId: string) {
    // Encontrar la notificación en la lista de directNotifications
    const notification = this.directNotifications.find(notif => notif.id === notificationId);
    
    if (notification) {
      const userIndex = notification.usuarioIds.findIndex((user) => user.userId === userId);
      if (userIndex !== -1 && !notification.usuarioIds[userIndex].leido) {
        notification.usuarioIds[userIndex].leido = true; // Actualizar el estado localmente
        await this.messagingService.updateNotificationReadStatus(notificationId); // Actualizar en Firestore
      }
    }
  }
  

  corregirNotificaciones() {
    const userId = this.getCurrentUserId(); // Obtén el ID del usuario actual
    if (userId) {
      this.messagingService
        .corregirNotificacionesDirectas(userId) // Pasa el ID del usuario como argumento
    } else {
      console.error('No se pudo obtener el ID del usuario actual para la corrección.');
    }
  }

  


  ocultarNotificacion(notificacionId: string) {
    this.currentNotifications = this.currentNotifications.filter(
      (notif) => notif.id !== notificacionId
    );
    this.hiddenNotificationIds.push(notificacionId); // Agregar el ID a la lista de ocultos
    this.saveHiddenNotificationIds();
  }
  ocultarNotificacionDirecta(notificationId: string) {
    this.directNotifications = this.directNotifications.filter(
      (notif) => notif.id !== notificationId
    );
    if (!this.hiddenNotificationIds.includes(notificationId)) {
      this.hiddenNotificationIds.push(notificationId); // Agregar el ID a la lista de ocultos
      this.saveHiddenNotificationIds(); // Guardar en localStorage
    }
    this.notificationService.loadUnreadNotificationsCount(); // Actualiza el contador
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
