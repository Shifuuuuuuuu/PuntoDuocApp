import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';

initializeApp(environment.firebaseConfig);
// Registrar el Service Worker de Firebase para recibir mensajes en segundo plano
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registrado correctamente:', registration);
    })
    .catch((error) => {
      console.error('Error al registrar el Service Worker:', error);
    });
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
