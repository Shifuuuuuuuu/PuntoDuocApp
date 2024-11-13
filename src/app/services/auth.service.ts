import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map} from 'rxjs/operators';
import 'firebase/compat/auth';
import firebase from 'firebase/compat/app';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {
    this.checkStoredSession();
  }

  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  private checkStoredSession() {
    // Si hay un correo en localStorage, emitirlo para mantener la sesión en toda la app
    const storedEmail = this.getStoredUserEmail();
    if (storedEmail) {
      this.currentUserEmailSubject.next(storedEmail);
    }
  }

  setCurrentUserEmail(email: string): void {
    this.currentUserEmailSubject.next(email);
    localStorage.setItem('currentUserEmail', email);
  }

  getCurrentUserEmail(): Observable<string | undefined> {
    const correo = localStorage.getItem('currentUserEmail');
    return of(correo ? correo : undefined);
  }

  getCurrentUserEmailSync(): string | undefined {
    return this.currentUserEmailSubject.getValue() || localStorage.getItem('currentUserEmail') || undefined;
  }

  async login(email: string, password: string): Promise<Estudiante | null> {
    try {
      // Iniciar sesión sin almacenar 'userCredential'
      await firebase.auth().signInWithEmailAndPassword(email, password);

      const estudianteSnapshot = await this.firestore.collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

      if (estudianteSnapshot && !estudianteSnapshot.empty) {
        const estudianteDoc = estudianteSnapshot.docs[0];
        const estudianteData = estudianteDoc.data() as Estudiante;
        estudianteData.id_estudiante = estudianteDoc.id;

        // Almacenar el tipo de usuario en localStorage
        localStorage.setItem('userType', 'estudiante');
        localStorage.setItem('id', estudianteData.id_estudiante);

        return estudianteData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error en AuthService.login:', error);
      throw error;
    }
  }



  isEstudiante(): boolean {
    return localStorage.getItem('userType') === 'estudiante';
  }

  isInvitado(): boolean {
    return localStorage.getItem('userType') === 'invitado';
  }

  // Método para establecer el tipo de usuario en el almacenamiento local
  setUserType(userType: 'estudiante' | 'invitado'): void {
    localStorage.setItem('userType', userType);
  }


  async logout(): Promise<void> {
    try {
      await firebase.auth().signOut();
      this.currentUserEmailSubject.next(undefined);
      localStorage.removeItem('currentUserEmail');
      localStorage.removeItem('id'); // Limpiar otros datos de usuario, si es necesario
    } catch (error) {
      console.error('Error en AuthService.logout:', error);
      throw error;
    }
  }

  async getEstudianteByEmail(email: string): Promise<Estudiante | null> {
    try {
      const estudianteSnapshot = await this.firestore.collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

      if (estudianteSnapshot && !estudianteSnapshot.empty) {
        const estudianteDoc = estudianteSnapshot.docs[0];
        const estudianteData = estudianteDoc.data() as Estudiante;
        estudianteData.id_estudiante = estudianteDoc.id;
        return estudianteData;
      }
      return null;
    } catch (error) {
      console.error('Error en AuthService.getEstudianteByEmail:', error);
      throw error;
    }
  }

  getEstudianteByEmails(email: string): Observable<Estudiante | null> {
    return this.firestore
      .collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', email))
      .valueChanges({ idField: 'id_estudiante' })
      .pipe(
        map(estudiantes => (estudiantes.length > 0 ? estudiantes[0] : null))
      );
  }

  async updateEstudiante(estudiante: Estudiante): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    try {
      await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).update(estudiante);
    } catch (error) {
      console.error('Error en AuthService.updateEstudiante:', error);
      throw error;
    }
  }
}
