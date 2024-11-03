
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Invitado, InvitadoSinPassword } from '../interface/IInvitado';
import { BehaviorSubject,  Observable, of } from 'rxjs';
import {  map } from 'rxjs/operators';
import 'firebase/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { arrayUnion, arrayRemove } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class InvitadoService {
  private invitadosCollection: AngularFirestoreCollection<InvitadoSinPassword>;

  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth) {
    this.invitadosCollection = this.firestore.collection<InvitadoSinPassword>('Invitados');
  }

  // Método para registrar un invitado con autenticación y enviar verificación de correo
  async registrarInvitado(invitado: Invitado): Promise<Omit<Invitado, 'password'>> {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(invitado.email, invitado.password);
    const uid = userCredential.user?.uid;

    // Enviar verificación de correo electrónico
    if (userCredential.user) {
      await userCredential.user.sendEmailVerification();
    }

    // Crear el objeto con la información básica
    const invitadoData: Omit<Invitado, 'password'> = {
      id_Invitado: invitado.id_Invitado,
      email: invitado.email,
      Nombre_completo: invitado.Nombre_completo,
      Rut: invitado.Rut,
      Telefono: invitado.Telefono,
      codigoQr: invitado.codigoQr,
      eventosInscritos: invitado.eventosInscritos || [],
    };

    // Guardar el invitado en Firestore
    await this.invitadosCollection.doc(uid).set(invitadoData);

    return { ...invitadoData, id_Invitado: uid };
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

  // Método para verificar si un invitado existe por correo electrónico
  verificarInvitadoPorCorreo(correo: string): Observable<boolean> {
    return this.firestore
      .collection<Invitado>('Invitados', ref => ref.where('email', '==', correo))
      .valueChanges()
      .pipe(map(invitados => invitados.length > 0));
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


}
