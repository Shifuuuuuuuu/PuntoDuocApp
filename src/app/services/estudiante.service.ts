import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante'; // Asegúrate de tener la interfaz creada
import {  map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Evento } from '../interface/IEventos';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {

  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth,private angularFireMessaging: AngularFireMessaging) { }

  // Obtener eventos asistidos por categoría
  obtenerEventosAsistidosPorCategoria(estudianteId: string): Promise<Evento[]> {
    return this.firestore.collection<Evento>('Eventos').get()
      .toPromise()
      .then(snapshot => {
        if (snapshot && !snapshot.empty) {
          const eventosAsistidos: Evento[] = snapshot.docs
            .map(doc => {
              const data = doc.data() as Evento;

              // Verificar si el estudiante está inscrito en el evento y obtener su estado de verificación
              const inscripcion = data.Inscripciones?.find((inscripcion: any) =>
                inscripcion.id_estudiante === estudianteId
              );

              if (inscripcion) {
                // Añadir la información de verificación a cada evento
                return {
                  ...data,
                  verificado: inscripcion.verificado || false // `true` si está verificado, `false` si no
                };
              }
              return null;
            })
            .filter(evento => evento !== null) as Evento[]; // Filtrar eventos donde el estudiante está inscrito

          return eventosAsistidos;
        } else {
          console.log('No se encontraron eventos en la colección.');
          return [];
        }
      })
      .catch(error => {
        console.error('Error al obtener eventos asistidos por categoría:', error);
        return [];
      });
  }

  obtenerHistorialPuntajeDesdeFirestore(estudianteId: string): Observable<{ fecha: string; puntaje: number }[]> {
    return this.firestore
      .collection('Estudiantes')
      .doc(estudianteId)
      .collection('historialPuntaje', ref => ref.orderBy('fecha', 'asc'))
      .valueChanges()
      .pipe(
        map((historial: any[]) => {
          // Crear un objeto para almacenar el puntaje total por fecha
          const puntajePorFecha: { [fecha: string]: number } = {};

          historial.forEach((data: any) => {
            // Convertir la fecha al formato de cadena deseado
            const fecha = data.fecha?.toDate().toLocaleDateString('es-ES') || 'Fecha desconocida';

            // Sumar el puntaje de cada verificación en la misma fecha
            if (!puntajePorFecha[fecha]) {
              puntajePorFecha[fecha] = 0; // Inicializar si no existe
            }
            puntajePorFecha[fecha] += data.puntaje;
          });

          // Convertir el objeto en un array de objetos con fecha y puntaje
          return Object.keys(puntajePorFecha).map(fecha => ({
            fecha,
            puntaje: puntajePorFecha[fecha]
          }));
        })
      );
  }

  async registrarEstudiante(estudiante: Estudiante): Promise<Omit<Estudiante, 'password'>> {
    // Registrar usuario en Firebase Authentication usando email y password
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(estudiante.email, estudiante.password);

    // Enviar correo de verificación
    await userCredential.user?.sendEmailVerification();

    // Obtener el UID generado por Firebase Authentication
    const uid = userCredential.user?.uid;

    // Crear el objeto estudianteData sin el campo password
    const estudianteData: Omit<Estudiante, 'password'> = {
        email: estudiante.email,
        Nombre_completo: estudiante.Nombre_completo,
        Rut: estudiante.Rut,
        Telefono: estudiante.Telefono,
        carrera: estudiante.carrera,
        puntaje: 0,
        id_estudiante: uid,
        codigoQr: '',  // Puedes dejar esto vacío hasta que lo generes
        eventosInscritos: [],
        tokenFCM: null,
        verificado: false // Establecer verificado como false
    };

    // Guardar los datos del estudiante en Firestore, excluyendo el password
    await this.firestore.collection<Omit<Estudiante, 'password'>>('Estudiantes').doc(uid).set(estudianteData);

    return estudianteData; // Retornar los datos del estudiante registrado
}

  // Método para solicitar restablecimiento de contraseña
  async restablecerPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log("Correo de restablecimiento enviado");
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      throw error;
    }
  }

  // Obtener el ID del usuario
  getUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => {
        return user ? user.uid : null;
      })
    );
  }

  // Obtener un estudiante por ID
  getUserById(userId: string): Observable<any> {
    return this.firestore.collection('Estudiantes').doc(userId).valueChanges();
  }

  // Obtener estudiante por correo
  getEstudianteByEmail(email: string): Promise<Estudiante | null> {
    return this.firestore.collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', email))
      .get()
      .toPromise()
      .then(snapshot => {
        if (snapshot && !snapshot.empty) {
          return snapshot.docs[0].data() as Estudiante;
        } else {
          return null;
        }
      });
  }

  // Verificar si un estudiante existe por correo
  verificarEstudiantePorCorreo(correo: string): Observable<boolean> {
    return this.firestore
      .collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', correo))
      .valueChanges()
      .pipe(
        map(estudiantes => estudiantes.length > 0)
      );
  }

  // Actualizar datos del estudiante
  async updateEstudiante(estudiante: Omit<Estudiante, 'password'>): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }

  // Actualizar puntaje del estudiante
  async actualizarPuntajeEstudiante(id_estudiante: string, puntosAdicionales: number): Promise<void> {
    const estudianteRef = this.firestore.collection('Estudiantes').doc(id_estudiante);
    await estudianteRef.update({
      puntaje: firebase.firestore.FieldValue.increment(puntosAdicionales)
    });
  }

  // Agregar evento a estudiante
  async agregarEventoAEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayUnion(eventoId)
    });
  }

  // Eliminar evento de estudiante
  async eliminarEventoDeEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayRemove(eventoId)
    });
  }

  // Obtener estudiante por ID
  async obtenerEstudiantePorId(id: string): Promise<Estudiante | null> {
    if (!id) {
      console.error('ID vacío proporcionado al obtener estudiante por ID');
      return null;
    }

    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(id).get().toPromise();
      if (estudianteDoc && estudianteDoc.exists) {
        const estudianteData = estudianteDoc.data() as Estudiante;
        estudianteData.id_estudiante = estudianteDoc.id;
        return estudianteData;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener el estudiante por ID:', error);
      throw error;
    }
  }
  async verificarCorreoExistente(email: string): Promise<boolean> {
    try {
      const snapshot = await this.firestore.collection('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

      // Verificar si snapshot no es undefined y si no está vacío
      return snapshot ? !snapshot.empty : false;
    } catch (error) {
      console.error('Error al verificar el correo:', error);
      throw error;
    }
  }

  // Actualizar puntaje de estudiante
  updateEstudiantePuntaje(id_estudiante: string, puntaje: number) {
    return this.firestore.collection('Estudiantes').doc(id_estudiante).update({ puntaje });
  }

  // Actualizar puntaje con fecha
  async actualizarPuntajeConFecha(estudianteId: string, puntos: number): Promise<void> {
    const puntajeDoc = {
      puntaje: puntos,
      fecha: firebase.firestore.FieldValue.serverTimestamp() // Fecha actual del servidor
    };

    await this.firestore.collection('Estudiantes').doc(estudianteId).update({
      historialPuntaje: firebase.firestore.FieldValue.arrayUnion(puntajeDoc)
    });
  }
  async solicitarPermisosYObtenerToken(estudianteId: string): Promise<string | null> {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Asegúrate de que requestToken esté correctamente definido
            const token = await firstValueFrom(this.angularFireMessaging.requestToken);

            if (token) {
                await this.firestore.collection('Estudiantes').doc(estudianteId).update({
                    tokenFCM: token,
                });
                return token; // Asegúrate de que aquí se retorne un token de tipo string
            } else {
                console.warn('No se pudo obtener el token FCM.');
                return null; // Retorna null si no hay token
            }
        } else {
            console.log('Permiso de notificación denegado.');
            return null; // Retorna null si no se concedió el permiso
        }
    } catch (error) {
        console.error('Error al obtener el token FCM:', error);
        throw error; // Propaga el error
    }
}
async verificarEstudiante(email: string): Promise<void> {
  const estudianteRef = this.firestore.collection('Estudiantes', ref => ref.where('email', '==', email));
  const snapshot = await estudianteRef.get().toPromise();

  if (snapshot && !snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await this.firestore.collection('Estudiantes').doc(docId).update({ verificado: true });
  } else {
    console.warn(`No se encontró un estudiante con el correo: ${email}`);
  }
}
async obtenerEstudiantePorEmail(email: string): Promise<Estudiante | null> {
  const snapshot = await this.firestore.collection('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();
  if (snapshot && !snapshot.empty) {
    return snapshot.docs[0].data() as Estudiante;
  }
  return null;
}
async sumarPuntaje(userId: string, puntos: number): Promise<void> {
  const estudianteDocRef = this.firestore.collection('Estudiantes').doc(userId);
  await estudianteDocRef.update({
    puntaje: firebase.firestore.FieldValue.increment(puntos)
  });
}
}
