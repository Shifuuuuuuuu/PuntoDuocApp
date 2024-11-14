import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();

  constructor(private firestore: AngularFirestore) {}

  addNotification(notification: any) {
    notification.isRead = false; // Marca la nueva notificación como no leída
    this.firestore.collection('Notificaciones').add(notification); // Agrega la notificación a Firestore
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.firestore.collection('Notificaciones').get().subscribe(snapshot => {
      snapshot.docs.forEach(doc => {
        this.firestore.collection('Notificaciones').doc(doc.id).update({ isRead: true });
      });
    });
    this.updateUnreadCount();
  }

  updateUnreadCount() {
    this.getNotifications().subscribe(notifications => {
      const count = notifications.filter(notification => !notification.isRead).length;
      this.unreadCount.next(count);
    });
  }

  getNotifications(): Observable<any[]> {
    return this.firestore.collection('Notificaciones').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
