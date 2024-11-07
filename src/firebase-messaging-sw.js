importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// Inicializar Firebase con la configuración de tu proyecto
firebase.initializeApp({
  apiKey: "AIzaSyDo7PfmgYR63N_f-_QGxJsY-BeDFjWWd3E",
  authDomain: "puntoduoc-894e9.firebaseapp.com",
  projectId: "puntoduoc-894e9",
  storageBucket: "puntoduoc-894e9.firebasestorage.app",
  messagingSenderId: "445454255986",
  appId: "1:445454255986:web:33d22798835dd6d0d0ffeb",
  measurementId: "G-LBNH8NQWKG"
});

// Inicializar el servicio de mensajería de Firebase
const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Puedes cambiar esto por el ícono de tu aplicación
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
