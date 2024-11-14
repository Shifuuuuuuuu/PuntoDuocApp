import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { initializeApp } from 'firebase/app';
import { environment } from './environments/environment';
import { enableProdMode } from '@angular/core';
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

// Monitorear si se abre la consola del navegador
if (typeof window !== 'undefined') {
  let openConsoleDetected = false;

  const detectConsole = () => {
    if (openConsoleDetected) return;

    const devtools = /./;
    devtools.toString = function() {
      openConsoleDetected = true;
      return ''; // Devolver un string vacío para evitar el error
    };
    console.log('%c', devtools);
  };
  if (environment.production) {
    enableProdMode();
  }

  window.addEventListener('devtoolschange', detectConsole);
  setInterval(detectConsole, 1000);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
