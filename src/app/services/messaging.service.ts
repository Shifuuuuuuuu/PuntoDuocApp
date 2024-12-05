import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Notificacion, UsuarioId } from '../interface/INotificacion';

export interface NotificacionesDirectas {
  id: string;
  titulo: string;
  cuerpo: string;
  timestampt: Date;
  usuarioIds: { userId: string; leido: boolean }[];
  tipo?: string; // Nuevo campo para tipo de usuario
}

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  currentMessage = new BehaviorSubject<any>(null);

  constructor(
    private afMessaging: AngularFireMessaging,
    private notificationService: NotificationService,
    private firestore: AngularFirestore
  ) {
    this.afMessaging.messages.subscribe((message: any) => {
      this.handleForegroundMessage(message);
    });
  }

  // Solicitar permisos para recibir notificaciones push
  requestPermission() {
    this.afMessaging.requestToken.pipe(take(1)).subscribe(
      (token) => {
        // Manejo del token
      },
      (error) => {
        console.error('Error al obtener el token FCM:', error);
      }
    );
  }

  // Escuchar mensajes en tiempo real
  receiveMessage() {
    this.afMessaging.messages.subscribe((payload) => {
      console.log('Mensaje recibido.', payload);
      this.currentMessage.next(payload);
    });
  }

  getDirectNotifications(): Observable<NotificacionesDirectas[]> {
    const userType = localStorage.getItem('userType');  // Obtener el userType desde localStorage
    const userId = localStorage.getItem('id');  // Obtener el userId desde localStorage

    // Log de los valores obtenidos de localStorage
    console.log('User Type:', userType);
    console.log('User ID:', userId);

    return this.firestore
      .collection<NotificacionesDirectas>('NotificacionesDirectas', ref =>
        ref.where('destinatario', '==', userType)  // Filtramos por destinatario que coincida con userType
          .where('leido', '==', false)  // Filtramos para mostrar solo las notificaciones no leídas
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map((notifications: NotificacionesDirectas[]) => {
          console.log('Notificaciones obtenidas:', notifications); // Log de las notificaciones obtenidas

          return notifications.filter(notification => {
            // Log para cada notificación
            console.log('Verificando notificación:', notification);

            // Filtramos por el usuarioId dentro del array usuarioIds
            const userNotification = notification.usuarioIds.find(user => user.userId === userId);

            // Log si encontramos el userNotification
            console.log('User Notification:', userNotification);

            // Verificamos si se encontró el userId y si su 'leido' es false
            return userNotification && userNotification.leido === false;
          });
        })
      );
  }




  getCurrentUserId(): string | null {
    const userId = localStorage.getItem('id');
    if (!userId) {
      console.error('No se encontró el ID del usuario en el almacenamiento local.');
    }
    return userId;
  }

  async corregirNotificacionesDirectas(userId: string) {
    try {
      const snapshot = await this.firestore.collection('NotificacionesDirectas').get().toPromise();

      if (snapshot && !snapshot.empty) {
        const batch = this.firestore.firestore.batch();

        snapshot.forEach((doc) => {
          const data = doc.data() as any;

          if (!Array.isArray(data.usuarioIds) || !data.usuarioIds.some((user: any) => user.userId === userId)) {
            console.log(`Corrigiendo notificación ${doc.id}...`);

            const usuarioIds = Array.isArray(data.usuarioIds) ? data.usuarioIds : [];
            usuarioIds.push({ userId, leido: false });
            batch.update(doc.ref, { usuarioIds });
          }
        });

        await batch.commit();
      } else {
        console.log('No se encontraron notificaciones directas para corregir.');
      }
    } catch (error) {
      console.error('Error al corregir las notificaciones directas:', error);
    }
  }

  async updateNotificationReadStatus(notificationId: string): Promise<void> {
    const userId = localStorage.getItem('id'); // Obtener el userId desde localStorage

    if (!userId) {
      console.error('No se pudo obtener el ID del usuario desde localStorage');
      return;
    }

    try {
      // Verificar si la colección es 'NotificacionesDirectas', si es así, no hacer nada
      if (notificationId.startsWith('NotificacionesDirectas')) {
        console.log('Colección NotificacionesDirectas, no se realizará ninguna actualización.');
        return; // No realiza ninguna acción si está en 'NotificacionesDirectas'
      }

      const notificationRef = this.firestore.collection('NotificacionesDirectas').doc(notificationId);
      const notificationDoc = await notificationRef.get().toPromise();

      if (notificationDoc && notificationDoc.exists) {
        const notificationData = notificationDoc.data() as NotificacionesDirectas;
        const userIndex = notificationData.usuarioIds.findIndex((user) => user.userId === userId);

        if (userIndex !== -1) {
          // Marcar la notificación como leída solo si el usuario existe en el array
          notificationData.usuarioIds[userIndex].leido = true;
          console.log("Notificación marcada como leída");

          // Actualizar la notificación en Firestore
          await notificationRef.update({ usuarioIds: notificationData.usuarioIds });
          console.log(`Notificación ${notificationId} marcada como leída para el usuario ${userId}.`);
        } else {
          console.warn(`El usuario con id ${userId} no tiene acceso a esta notificación.`);
        }
      } else {
        console.warn(`La notificación con ID ${notificationId} no existe o no se pudo obtener.`);
      }
    } catch (error) {
      console.error('Error al actualizar el estado de lectura de la notificación:', error);
    }
  }



  private handleForegroundMessage(message: any) {
    console.log('Mensaje recibido en primer plano:', message);

    if (message.notification) {
      const notification: Notificacion = {
        id: '',
        titulo: message.notification.title || 'Sin título',
        descripcion: message.notification.body || 'Sin contenido',
        fecha: new Date(),
        imagen: message.notification.image,
        url: message.notification.click_action,
        usuarioIds: [],
      };

      this.notificationService.addNotification(notification);
      this.currentMessage.next(notification);
    }
  }

  async sendNotification(notification: Notificacion) {
    if (!notification || !notification.id || !notification.titulo) {
      console.error('La notificación es inválida o faltan campos obligatorios.');
      return;
    }

    try {
      // Buscar si la notificación ya existe en Firestore
      const existingNotification = await this.firestore.collection('Notificaciones')
        .ref.where('id', '==', notification.id).get();

      if (existingNotification.empty) {
        // Si no existe, agregarla como una nueva notificación
        await this.firestore.collection('Notificaciones').add({
          id: notification.id,
          titulo: notification.titulo,
          descripcion: notification.descripcion,
          imagen: notification.imagen || '',
          url: notification.url || '',
          fecha: notification.fecha || new Date(),
          fechaTermino: notification.fechaTermino || null,
          usuarioIds: notification.usuarioIds || []
        });
        console.log(`Notificación guardada en Firestore para usuario(s).`);
      } else {
        // Si ya existe, actualizar los IDs de usuario
        for (const doc of existingNotification.docs) {
          const notificacionExistente = doc.data() as Notificacion;

          // Filtrar nuevos usuarios que no estén ya en usuarioIds
          const nuevosIds = notification.usuarioIds.filter((newUser: UsuarioId) =>
            !notificacionExistente.usuarioIds.some((existingUser: UsuarioId) => existingUser.userId === newUser.userId)
          );

          if (nuevosIds.length > 0) {
            // Añadir los nuevos usuarios a la lista
            notificacionExistente.usuarioIds.push(...nuevosIds);
            await this.firestore.collection('Notificaciones').doc(doc.id).update({
              usuarioIds: notificacionExistente.usuarioIds
            });
            console.log(`Nuevos ID(s) de usuario agregado(s) a la notificación.`);
          } else {
            console.log('Todos los ID(s) de usuario ya existen en la notificación.');
          }
        }
      }
    } catch (error) {
      console.error('Error al enviar o guardar la notificación:', error);
    }
  }



  async addDirectNotification(notification: NotificacionesDirectas, userId: string) {
    try {
      const usuarioId = { userId, leido: false };

      const existingNotification = await this.firestore
        .collection('NotificacionesDirectas')
        .doc(notification.id)
        .get()
        .toPromise();

      if (existingNotification && existingNotification.exists) {
        console.log(`La notificación con ID ${notification.id} ya existe.`);
      } else {
        notification.usuarioIds = notification.usuarioIds || [];
        notification.usuarioIds.push(usuarioId);
        await this.firestore.collection('NotificacionesDirectas').doc(notification.id).set(notification);
        console.log(`Notificación directa creada con éxito para el usuario ${userId}.`);
      }
    } catch (error) {
      console.error('Error al agregar la notificación directa:', error);
    }
  }
}
