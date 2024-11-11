import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();
  private notifications: any[] = []; // Array para almacenar notificaciones

  constructor() {}

  addNotification(notification: any) {
    notification.isRead = false; // Marca la nueva notificación como no leída
    this.notifications.unshift(notification);
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.notifications.forEach(notification => notification.isRead = true);
    this.updateUnreadCount();
  }

  updateUnreadCount() {
    const count = this.notifications.filter(notification => !notification.isRead).length;
    this.unreadCount.next(count); // Actualiza el contador en el servicio
  }

  getNotifications() {
    return this.notifications; // Devuelve el array de notificaciones
  }
}
