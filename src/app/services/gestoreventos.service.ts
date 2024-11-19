import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

import { GestorEventos } from '../interface/IGestorEventos';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class GestorEventosService {
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  setCurrentUserEmail(email: string): void {
    this.currentUserEmailSubject.next(email);
    localStorage.setItem('currentUserEmail', email);
  }

  getCurrentUserEmail(): Observable<string | undefined> {
    return this.currentUserEmail$;
  }
  async loginWithAuth(email: string, password: string): Promise<GestorEventos | null> {
    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

      if (userCredential.user) {
        // Obtener datos adicionales desde Firestore después de la autenticación
        const gestorData = await this.getGestorByEmail(email);
        if (gestorData) {
          console.log('Inicio de sesión como gestor de eventos exitoso:', gestorData);
          this.setCurrentUserEmail(email);
          gestorData.id_Geventos = userCredential.user.uid;
          return gestorData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error en GestorEventosService.loginWithAuth:', error);
      throw error;
    }
  }


  // Método para obtener un gestor por correo electrónico
  async getGestorByEmail(email: string): Promise<GestorEventos | null> {
    try {
      const gestoresSnapshot = await this.firestore
        .collection<GestorEventos>('GestorEventos', ref => ref.where('email', '==', email))
        .get()
        .toPromise();

      // Verificar si el snapshot está definido y no está vacío
      if (gestoresSnapshot && !gestoresSnapshot.empty) {
        const gestorDoc = gestoresSnapshot.docs[0];
        const gestorData = gestorDoc.data() as GestorEventos;
        gestorData.id_Geventos = gestorDoc.id;
        return gestorData;
      } else {
        console.warn('No se encontró el gestor con el email proporcionado.');
        return null;
      }
    } catch (error) {
      console.error('Error al obtener gestor por email:', error);
      throw error;
    }
  }


  // Método para actualizar la información del gestor
  async updateGestor(gestor: GestorEventos): Promise<void> {
    if (!gestor.id_Geventos) {
      console.error('ID del gestor no disponible para la actualización'); // Asegúrate de que el ID esté disponible
      throw new Error('ID del gestor no disponible para la actualización');
    }

    try {
      console.log('Actualizando gestor con ID:', gestor.id_Geventos); // Log para verificar que el ID está disponible
      await this.firestore.collection('GestorEventos').doc(gestor.id_Geventos).update(gestor);
      console.log('Perfil de gestor actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el perfil del gestor:', error);
      throw error;
    }
  }


  logout(): void {
    this.currentUserEmailSubject.next(undefined);
    localStorage.removeItem('currentUserEmail');
    console.log('Usuario deslogueado correctamente');
  }
}
