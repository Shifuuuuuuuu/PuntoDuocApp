import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private firestore: AngularFirestore) {}

  // Método para iniciar sesión basado en Firestore
  login(email: string, password: string): Promise<Estudiante | null> {
    return this.firestore.collection<Estudiante>('estudiantes', ref =>
      ref.where('email', '==', email).where('password', '==', password)
    )
    .get()
    .toPromise()
    .then((querySnapshot) => {
      // Verificar que querySnapshot no sea undefined y tenga documentos
      if (querySnapshot && !querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data() as Estudiante;
        return studentData; // Devuelve el objeto del estudiante si coincide
      } else {
        return null; // No coincide ningún documento, usuario no encontrado
      }
    })
    .catch(error => {
      console.error('Error al consultar Firestore:', error);
      throw error;
    });
  }

  // Método para registrar un nuevo estudiante (opcional)
  register(estudiante: Estudiante): Promise<void> {
    const id = this.firestore.createId(); // Generar un ID único para el nuevo estudiante
    return this.firestore.collection('estudiantes').doc(id).set(estudiante);
  }

  // Método para cerrar sesión (puedes vaciar cualquier almacenamiento local si lo implementas)
  logout(): Promise<void> {
    // Si estás usando localStorage para recordar la sesión, puedes limpiarlo aquí.
    return Promise.resolve();
  }
}
