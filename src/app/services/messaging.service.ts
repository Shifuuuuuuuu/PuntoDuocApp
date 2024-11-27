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
        console.log('Token FCM:', token);
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

  getDirectNotifications(userId: string) {
    return this.firestore
      .collection<NotificacionesDirectas>('NotificacionesDirectas')
      .valueChanges({ idField: 'id' });
  }
  

  // Manejar mensajes en primer plano
  private handleForegroundMessage(message: any) {
    console.log('Mensaje recibido en primer plano:', message);

    if (message.notification) {
      const notification: Notificacion = {
        id: '', // Generar un ID único si es necesario
        titulo: message.notification.title || 'Sin título',
        descripcion: message.notification.body || 'Sin contenido',
        fecha: new Date(),
        imagen: message.notification.image,
        url: message.notification.click_action,
        usuarioIds: [], // Agregar usuarios si corresponde
      };

      this.notificationService.addNotification(notification);
      this.currentMessage.next(notification);
    }
  }
  async sendNotification(notification: any) {
    try {
      const existingNotification = await this.firestore.collection('Notificaciones')
        .ref.where('id', '==', notification.id).get();

      if (existingNotification.empty) {
        await this.firestore.collection('Notificaciones').add({
          id: notification.id,
          titulo: notification.titulo,
          descripcion: notification.descripcion,
          imagen: notification.imagen || '',
          url: notification.url || '',
          fecha: notification.fecha || new Date(),
          fechaTermino: notification.fechaTermino,
          usuarioIds: notification.usuarioIds // Guarda los IDs de usuario con su estado de lectura
        });
        console.log(`Notificación guardada en Firestore para usuario(s).`);
      } else {
        existingNotification.docs.forEach(async doc => {
          const notificacionExistente = doc.data() as Notificacion;
          const nuevosIds: UsuarioId[] = notification.usuarioIds.filter((newUser: UsuarioId) =>
            !notificacionExistente.usuarioIds.some((existingUser: UsuarioId) => existingUser.userId === newUser.userId)
          );

          if (nuevosIds.length > 0) {
            notificacionExistente.usuarioIds.push(...nuevosIds);
            await this.firestore.collection('Notificaciones').doc(doc.id).update({
              usuarioIds: notificacionExistente.usuarioIds
            });
            console.log(`Nuevos ID(s) de usuario agregado(s) a la notificación.`);
          } else {
            console.log('Todos los ID(s) de usuario ya existen en la notificación.');
          }
        });
      }
    } catch (error) {
      console.error('Error al enviar o guardar la notificación:', error);
    }
  }
}
