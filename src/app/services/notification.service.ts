import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notificacion } from '../interface/INotificacion';
import { AuthService } from './auth.service';
import { EstudianteService } from './estudiante.service';
import { InvitadoService } from './invitado.service';
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();

  constructor(
    private firestore: AngularFirestore,
    private estudianteService: EstudianteService,
    private invitadoService: InvitadoService
  ) {
    this.loadUnreadNotificationsCount();
  }

  addNotification(notification: Notificacion) {
    if (!notification.usuarioIds) {
      notification.usuarioIds = [];
    }
    notification.fechaTermino = notification.fechaTermino || this.calcularFechaTermino();
    this.firestore.collection('Notificaciones').add(notification);
    this.updateUnreadCount();
  }

  private calcularFechaTermino(): Date {
    const fechaActual = new Date();
    fechaActual.setDate(fechaActual.getDate() + 7);
    return fechaActual;
  }

  async markAllAsRead() {
    const userId = await this.getCurrentUserId();
    if (userId) {
        return this.firestore.collection('Notificaciones').get().toPromise().then(snapshot => {
            if (snapshot && !snapshot.empty) {
                const batch = this.firestore.firestore.batch();
                snapshot.docs.forEach(doc => {
                    const notificationData = doc.data() as Notificacion;

                    let hasChanges = false;
                    const updatedUsuarioIds = notificationData.usuarioIds.map(user => {
                        if (user.userId === userId && !user.leido) {
                            console.log(`Marcando como leída la notificación ${doc.id} para el usuario ${userId}`);
                            hasChanges = true;
                            return { ...user, leido: true };
                        }
                        return user;
                    });

                    if (hasChanges) {
                        console.log(`Actualizando la notificación ${doc.id} con los nuevos usuarioIds:`, updatedUsuarioIds);
                        batch.update(doc.ref, { usuarioIds: updatedUsuarioIds });
                    }
                });

                return batch.commit().then(() => {
                    this.loadUnreadNotificationsCount(); // Actualiza el contador después de marcar como leídas
                });
            } else {
                console.log('No hay notificaciones no leídas.');
                return Promise.resolve();
            }
        }).catch(error => {
            console.error('Error al marcar las notificaciones como leídas:', error);
        });
    } else {
        console.error('No se pudo obtener el ID del usuario actual.');
        return Promise.resolve();
    }
}
async markNotificationAsRead(notificationId: string, userId: string) {
  const notificationRef = this.firestore.collection('Notificaciones').doc(notificationId);
  const notification = await notificationRef.get().toPromise();

  // Verifica si la notificación existe
  if (notification && notification.exists) {
    const data = notification.data() as Notificacion;
    const usuarioIds = data.usuarioIds || [];
    const userIndex = usuarioIds.findIndex((user) => user.userId === userId);

    if (userIndex !== -1) {
      usuarioIds[userIndex].leido = true; // Actualiza el estado de lectura
      return notificationRef.update({ usuarioIds });
    } else {
      console.warn(`El usuario ${userId} no está asociado a esta notificación.`);
      return Promise.resolve();
    }
  } else {
    console.error(`La notificación con ID ${notificationId} no existe.`);
    return Promise.resolve();
  }
}




  eliminarNotificacionesCaducadas() {
    return this.firestore.collection('Notificaciones', ref => ref.where('fechaTermino', '<=', new Date()))
      .get().toPromise().then(snapshot => {
        if (snapshot && !snapshot.empty) {
          const batch = this.firestore.firestore.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          return batch.commit();
        } else {
          return Promise.resolve();
        }
      }).then(() => {

      }).catch(error => {
        console.error('Error al eliminar notificaciones caducadas:', error);
      });
  }

  private async getCurrentUserId(): Promise<string | null> {
    let userId = null;
    if (localStorage.getItem('userType') === 'estudiante') {
      userId = await firstValueFrom(this.estudianteService.getUserId());
    } else if (localStorage.getItem('userType') === 'invitado') {
      userId = await firstValueFrom(this.invitadoService.getUserId());
    }
    return userId;
  }

  async loadUnreadNotificationsCount() {
    const userId = await this.getCurrentUserId();
    if (userId) {
      this.getNotifications().subscribe(notifications => {
        const count = notifications.reduce((acc, notification) => {
          return acc + notification.usuarioIds.filter(user => !user.leido && user.userId === userId).length;
        }, 0);
        this.unreadCount.next(count);
      });
    } else {
      console.log('No se pudo obtener el ID del usuario actual.');
    }
  }

  getNotifications(): Observable<Notificacion[]> {
    return this.firestore.collection('Notificaciones').snapshotChanges().pipe(
      map(actions => {
        const notifications = actions.map(a => {
          const data = a.payload.doc.data() as Notificacion;
          const id = a.payload.doc.id;
          return { ...data, id };
        });
        return notifications;
      })
    );
  }
  async updateUnreadCount() {
    const userId = await this.getCurrentUserId(); // Usa await para resolver la promesa
    if (userId) {
      this.getNotifications().subscribe(notifications => {
        const count = notifications.reduce((acc, notification) => {
          return acc + notification.usuarioIds.filter(user => !user.leido && user.userId === userId).length;
        }, 0);
        this.unreadCount.next(count);
        console.log(`Conteo actualizado de notificaciones no leídas: ${count}`);
      });
    } else {
      console.error('No se pudo obtener el ID del usuario actual para actualizar el contador.');
    }
  }

}
