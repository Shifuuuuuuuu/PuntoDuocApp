import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { BehaviorSubject, Observable } from 'rxjs';
import { map} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // BehaviorSubject para manejar el estado del correo electrónico actual
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  // Método privado para obtener el correo electrónico almacenado en localStorage
  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método para establecer el correo electrónico actual del usuario estudiante
  setCurrentUserEmail(email: string): void {
    console.log('AuthService: Estableciendo currentUserEmail a', email);
    this.currentUserEmailSubject.next(email);
    localStorage.setItem('currentUserEmail', email);
  }

  // Método para obtener el correo electrónico actual como observable
  getCurrentUserEmail(): Observable<string | undefined> {
    return this.currentUserEmail$;
  }

  // Método para obtener el correo electrónico actual de forma síncrona (si está disponible)
  getCurrentUserEmailSync(): string | undefined {
    return this.currentUserEmailSubject.getValue() || localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método de inicio de sesión para estudiantes
  async login(email: string, password: string): Promise<Estudiante | null> {
    try {
      // Buscar al estudiante en la colección 'Estudiantes' con el email proporcionado
      const estudianteSnapshot = await this.firestore.collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

      if (estudianteSnapshot && !estudianteSnapshot.empty) {
        const estudianteDoc = estudianteSnapshot.docs[0];
        const estudianteData = estudianteDoc.data() as Estudiante;

        // Verificar la contraseña (asegúrate de que las contraseñas estén almacenadas de forma segura, preferiblemente hasheadas)
        if (estudianteData.password === password) {
          estudianteData.id_estudiante = estudianteDoc.id;

          // Establecer el correo electrónico en el BehaviorSubject y localStorage
          this.setCurrentUserEmail(email);

          return estudianteData;
        } else {
          // Contraseña incorrecta
          return null;
        }
      } else {
        // No se encontró al estudiante
        return null;
      }
    } catch (error) {
      console.error('Error en AuthService.login:', error);
      throw error;
    }
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    try {
      // Limpiar el correo electrónico
      this.currentUserEmailSubject.next(undefined);
      localStorage.removeItem('currentUserEmail');
    } catch (error) {
      console.error('Error en AuthService.logout:', error);
      throw error;
    }
  }

  // Método para obtener un estudiante por correo electrónico
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


  // Método para actualizar un estudiante
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
