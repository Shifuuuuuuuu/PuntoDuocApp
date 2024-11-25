import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Notificacion, UsuarioId } from '../interface/INotificacion';

@Injectable({
  providedIn: 'root'
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

  requestPermission() {
    this.afMessaging.requestToken.pipe(take(1)).subscribe(
      (token) => {
        console.log('Token FCM:', token);
        // Aquí puedes guardar el token en Firestore o tu base de datos si es necesario
      },
      (error) => {
        console.error('Error al obtener el token FCM:', error);
      }
    );
  }

  receiveMessage() {
    this.afMessaging.messages.subscribe((payload) => {
      console.log("Message received. ", payload);
      this.currentMessage.next(payload);
    });
  }

  listenForMessages() {
    this.afMessaging.messages.subscribe(
      (message: any) => {
        this.handleForegroundMessage(message);
      },
      (error) => {
        console.error('Error al recibir el mensaje:', error);
      }
    );
  }

  private handleForegroundMessage(message: any) {
    console.log('Mensaje recibido en primer plano:', message);

    if (message.notification) {
      const notification: Notificacion = {
        id: '', // Genera un ID único si es necesario
        titulo: message.notification.title || 'Sin título',
        descripcion: message.notification.body || 'Sin contenido',
        fecha: new Date(),
        imagen: message.notification.image,
        url: message.notification.click_action,
        usuarioIds: [] // Agrega un array vacío o actualiza según sea necesario
      };

      // Agrega la notificación al servicio de notificaciones
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
