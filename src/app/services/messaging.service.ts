import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  currentMessage = new BehaviorSubject<any>(null);

  constructor(private afMessaging: AngularFireMessaging) {}

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

  listenForMessages() {
    this.afMessaging.messages.subscribe(
      (message) => {
        console.log('Mensaje recibido en primer plano:', message);
        this.currentMessage.next(message);
      },
      (error) => {
        console.error('Error al recibir el mensaje:', error);
      }
    );
  }
}
