import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante'; // Asegúrate de tener la interfaz creada
import { map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private estudiantesCollection = this.firestore.collection('estudiantes');

  constructor(private firestore: AngularFirestore) { }

  async registrarEstudiante(estudiante: Estudiante): Promise<Estudiante> {
    // Agregar el estudiante a Firestore y obtener la referencia del documento
    const docRef = await this.firestore.collection<Estudiante>('estudiantes').add(estudiante);

    // Crear el objeto Estudiante con el ID
    const estudianteRegistrado: Estudiante = {
      ...estudiante,
      id_estudiante: docRef.id // Asigna el ID del documento
    };

    // Retorna el objeto del estudiante con el ID
    return estudianteRegistrado;
}

  verificarEstudiantePorCorreo(correo: string) {
    return this.firestore.collection('estudiantes', ref => ref.where('email', '==', correo))
      .snapshotChanges()
      .pipe(
        map(estudiantes => estudiantes.length > 0)  // Devuelve true si hay un estudiante registrado con ese correo
      );
  }
  async updateEstudiante(estudiante: Estudiante): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    await this.firestore.collection('estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }
}
