import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GestorEventos } from '../interface/IGestorEventos';


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
  async login(email: string, password: string): Promise<GestorEventos | null> {
    try {
      const gestoresSnapshot = await this.firestore.collection<GestorEventos>('GestorEventos', ref => ref.where('email', '==', email)).get().toPromise();
      if (gestoresSnapshot && !gestoresSnapshot.empty) {
        const gestorDoc = gestoresSnapshot.docs[0];
        const gestorData = gestorDoc.data() as GestorEventos;

        if (gestorData.password === password) {
          gestorData.id_Geventos = gestorDoc.id;
          this.setCurrentUserEmail(email);
          return gestorData;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error en GestorEventosService.login:', error);
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
