import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUserEmail: string = ""; // Cambiar a "" por defecto

  constructor(private firestore: AngularFirestore) {}

  // Método para iniciar sesión basado en Firestore
  async login(email: string, password: string): Promise<Estudiante | null> {
    const querySnapshot = await this.firestore.collection<Estudiante>('estudiantes', ref =>
      ref.where('email', '==', email)
    ).get().toPromise();

    if (querySnapshot && !querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data() as Estudiante;

      // Verifica si la contraseña coincide
      if (studentData.password === password) {
        this.currentUserEmail = studentData.email; // Establece el email del usuario
        return studentData; // Devuelve el objeto del estudiante
      } else {
        console.error('Contraseña incorrecta');
        return null; // Contraseña incorrecta
      }
    } else {
      console.error('Usuario no encontrado');
      return null; // No coincide ningún documento, usuario no encontrado
    }
  }

  // Método para obtener el email del usuario actual
  getCurrentUserEmail(): string | undefined {
    return this.currentUserEmail || undefined; // Retorna el email actual o null
  }

  // Obtener estudiante por email
  async getEstudianteByEmail(email: string): Promise<Estudiante | undefined> {
    // Verifica que el email no sea undefined
    if (!email) {
      console.error('El email no puede ser undefined');
      return undefined;
    }

    const snapshot = await this.firestore.collection<Estudiante>('estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

    if (snapshot && !snapshot.empty) {
      const estudianteData = snapshot.docs[0].data() as Estudiante;
      estudianteData.id_estudiante = snapshot.docs[0].id; // Guarda el ID para las actualizaciones
      return estudianteData;
    }
    return undefined;
  }

  // Actualizar estudiante
  async updateEstudiante(estudiante: Estudiante): Promise<void> {
    await this.firestore.collection('estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    this.currentUserEmail = ""; // Limpia el email del usuario actual
    return Promise.resolve(); // Ajusta esto según tu implementación
  }
}
