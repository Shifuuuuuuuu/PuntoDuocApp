
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Invitado, InvitadoSinPassword } from '../interface/IInvitado';
import { BehaviorSubject,  firstValueFrom,  Observable, of } from 'rxjs';
import {  map } from 'rxjs/operators';
import 'firebase/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { arrayUnion, arrayRemove } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';

@Injectable({
  providedIn: 'root'
})
export class InvitadoService {

  private invitadosCollection: AngularFirestoreCollection<InvitadoSinPassword>;

  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth,private angularFireMessaging: AngularFireMessaging,) {
    this.invitadosCollection = this.firestore.collection<InvitadoSinPassword>('Invitados');
  }

  // Método para registrar un invitado con autenticación y enviar verificación de correo
  async registrarInvitado(invitado: Invitado): Promise<Omit<Invitado, 'password'>> {
    try {
      // Cerrar sesión antes de registrar para evitar mantener la sesión activa de un usuario previo
      await this.afAuth.signOut();

      const userCredential = await this.afAuth.createUserWithEmailAndPassword(invitado.email, invitado.password);
      console.log('Usuario registrado en Firebase Authentication:', userCredential);

      // Enviar correo de verificación
      if (userCredential.user) {
        await userCredential.user.sendEmailVerification();
        console.log('Correo de verificación enviado a:', invitado.email);
      }

      // Crear el objeto invitado sin el campo password
      const invitadoData: Omit<Invitado, 'password'> = {
        id_Invitado: userCredential.user?.uid || '',
        email: invitado.email,
        Nombre_completo: invitado.Nombre_completo,
        Rut: invitado.Rut,
        Telefono: invitado.Telefono,
        codigoQr: '',
        tokenFCM: '',
        verificado: false
      };

      // Guardar los datos del invitado en Firestore
      await this.firestore.collection<Omit<Invitado, 'password'>>('Invitados').doc(invitadoData.id_Invitado).set(invitadoData);
      console.log('Datos del invitado guardados en Firestore:', invitadoData);

      return invitadoData;
    } catch (error) {
      console.error('Error al registrar en Firebase Authentication:', error);
      throw error;
    }
  }
  // invitado.service.ts
async login(email: string, password: string): Promise<Invitado | null> {
  const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
  const uid = userCredential.user?.uid;

  if (uid) {
    const invitadoSnapshot = await this.firestore.collection<Invitado>('Invitados', ref => ref.where('email', '==', email)).get().toPromise();

    if (invitadoSnapshot && !invitadoSnapshot.empty) {
      const invitadoDoc = invitadoSnapshot.docs[0];
      const invitadoData = invitadoDoc.data() as Invitado;

      // Guardar el tipo de usuario en localStorage
      localStorage.setItem('userType', 'invitado');
      localStorage.setItem('id', uid);

      return invitadoData;
    }
  }
  return null;
}

async verificarInvitadoPorCorreo(correo: string): Promise<boolean> {
  try {
    const snapshot = await this.firestore
      .collection('Invitados', ref => ref.where('email', '==', correo))
      .get()
      .toPromise();

    // Agregar más logs para ver los resultados de la consulta
    console.log('Snapshot de la consulta:', snapshot);
    if (snapshot && !snapshot.empty) {
      console.log('El correo ya existe en la base de datos.');
      return true;
    } else {
      console.log('El correo no existe en la base de datos.');
      return false;
    }
  } catch (error) {
    console.error('Error al verificar el correo:', error);
    throw error;
  }
}



  // Método para restablecer la contraseña
  async restablecerContrasena(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log('Correo de restablecimiento de contraseña enviado.');
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento de contraseña:', error);
      throw error;
    }
  }

  // Método para actualizar el invitado
  async updateInvitado(invitado: Omit<Invitado, 'password'>): Promise<void> {
    if (!invitado.id_Invitado) {
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.invitadosCollection.doc(invitado.id_Invitado).update(invitado);
  }
  obtenerInvitadoPorEmail(email: string): Observable<Invitado | null> {
    return this.firestore.collection<Invitado>('Invitados', ref => ref.where('email', '==', email))
      .valueChanges()
      .pipe(
        map(invitados => invitados.length > 0 ? invitados[0] : null)
      );
  }


  // Método para guardar el código QR
  async guardarCodigoQr(invitado: Omit<Invitado, 'password'>): Promise<void> {
    if (!invitado.id_Invitado) {
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.invitadosCollection.doc(invitado.id_Invitado).update({ codigoQr: invitado.codigoQr });
  }

  getCurrentUserEmail(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => user ? user.email : null)
    );
  }

  // Método para establecer el correo electrónico actual del usuario invitado
  setCurrentUserEmail(email: string): void {
    localStorage.setItem('currentUserEmail', email);
    this.currentUserEmailSubject.next(email);
  }

  // Método para limpiar el correo electrónico al cerrar sesión
  clearCurrentUserEmail(): void {
    localStorage.removeItem('currentUserEmail');
    this.currentUserEmailSubject.next(undefined);
  }
  getInvitadoByEmail(email: string): Promise<Invitado | null> {
    return this.firestore.collection<Invitado>('Invitados', ref => ref.where('email', '==', email))
      .get()
      .toPromise()
      .then(snapshot => {
        if (snapshot && !snapshot.empty) {
          return snapshot.docs[0].data() as Invitado;
        } else {
          return null;
        }
      })
      .catch(error => {
        console.error('Error al obtener invitado por email:', error);
        return null;
      });
  }


  // Métodos para agregar y eliminar eventos
  async agregarEventoAInvitado(invitadoId: string, eventoId: string): Promise<void> {
    const invitadoDocRef = this.firestore.collection('Invitados').doc(invitadoId);
    await invitadoDocRef.update({
      eventosInscritos: arrayUnion(eventoId),
    });
  }

  async eliminarEventoDeInvitado(invitadoId: string, eventoId: string): Promise<void> {
    const invitadoDocRef = this.firestore.collection('Invitados').doc(invitadoId);
    await invitadoDocRef.update({
      eventosInscritos: arrayRemove(eventoId),
    });
  }

  // Método privado para obtener el correo electrónico desde localStorage
  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método para obtener un invitado por ID
  async obtenerInvitadoPorId(id: string): Promise<Invitado | null> {
  if (!id) {
    console.error('ID vacío proporcionado al obtener invitado por ID');
    return null;
  }

  try {
    const invitadoDoc = await this.firestore.collection('Invitados').doc(id).get().toPromise();
    if (invitadoDoc && invitadoDoc.exists) {
      const invitadoData = invitadoDoc.data() as Invitado;
      return { ...invitadoData, id_Invitado: invitadoDoc.id };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener invitado por ID:', error);
    throw error;
  }
}
  // estudiante.service.ts e invitado.service.ts
  getUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => {
        console.log('Estado de autenticación del usuario:', user); // Verifica si el usuario está autenticado
        return user ? user.uid : null;
      })
    );
  }
  getUserById(userId: string): Observable<any> {
    return this.firestore.collection('Invitados').doc(userId).valueChanges();
  }

  async solicitarPermisosYObtenerToken(invitadoId: string): Promise<string | null> {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await firstValueFrom(
                this.angularFireMessaging.requestToken.pipe()
            );

            console.log('Token FCM obtenido:', token);
            if (token) {
                await this.firestore.collection('Invitados').doc(invitadoId).update({
                    tokenFCM: token,
                });
                return token;
            } else {
                console.warn('No se pudo obtener el token FCM.');
                return null;
            }
        } else {
            console.log('Permiso de notificación denegado.');
            return null;
        }
    } catch (error) {
        console.error('Error al obtener el token FCM:', error);
        throw error;
    }
}
async verificarInvitado(email: string): Promise<void> {
  const invitadoRef = this.firestore.collection('Invitados', ref => ref.where('email', '==', email));
  const snapshot = await invitadoRef.get().toPromise();

  if (snapshot && !snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await this.firestore.collection('Invitados').doc(docId).update({ verificado: true });
  } else {
    console.warn(`No se encontró un invitado con el correo: ${email}`);
  }
}



}
