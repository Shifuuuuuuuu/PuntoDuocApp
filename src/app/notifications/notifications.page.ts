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
  private hiddenNotificationIds: string[] = []; // Lista de IDs ocultos
  private messageSubscription: Subscription;

  constructor(
    private messagingService: MessagingService,
    private notificationService: NotificationService
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


  markDirectNotificationAsRead(notificationId: string) {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.notificationService.markNotificationAsRead(notificationId, userId)
        .then(() => {
          this.loadDirectNotifications(userId); // Recargar las notificaciones directas
          this.notificationService.loadUnreadNotificationsCount(); // Actualizar el contador
        })
        .catch((error) => {
          console.error(`Error al marcar como leída la notificación ${notificationId}:`, error);
        });
    } else {
      console.error('No se pudo obtener el ID del usuario actual para marcar la notificación como leída.');
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
    this.messagingService.getDirectNotifications().subscribe(
      async (directNotifications) => {

        // Filtrar notificaciones asociadas al usuario actual
        this.directNotifications = directNotifications.filter((notif) =>
          Array.isArray(notif.usuarioIds) && notif.usuarioIds.some((user) => user.userId === userId)
        );


        // Marcar como leídas las notificaciones del usuario
        for (const notif of this.directNotifications) {
          const userIndex = notif.usuarioIds.findIndex((user) => user.userId === userId);
          if (userIndex !== -1 && !notif.usuarioIds[userIndex].leido) {
            notif.usuarioIds[userIndex].leido = true; // Actualizar el estado localmente
            await this.messagingService.updateNotificationReadStatus(notif.id, userId); // Actualizar en Firestore
          }
        }
      },
      (error) => {
        console.error('Error al cargar las notificaciones directas:', error);
      }
    );
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

  onNotificationClick(notificationId: string) {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.markDirectNotificationAsRead(notificationId);
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
