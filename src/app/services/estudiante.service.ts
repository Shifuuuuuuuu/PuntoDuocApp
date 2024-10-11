import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante'; // Asegúrate de tener la interfaz creada
import { map } from 'rxjs';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class EstudianteService {


  constructor(private firestore: AngularFirestore) { }

  async registrarEstudiante(estudiante: Estudiante): Promise<Estudiante> {
    const docRef = await this.firestore.collection<Estudiante>('Estudiantes').add(estudiante);
    const estudianteRegistrado: Estudiante = {
      ...estudiante,
      id_estudiante: docRef.id
    };
    return estudianteRegistrado;
  }
  getUserById(userId: string): Observable<any> {
    return this.firestore.collection('Estudiantes').doc(userId).valueChanges();
  }
  verificarEstudiantePorCorreo(correo: string): Observable<boolean> {
    return this.firestore.collection('Estudiantes', ref => ref.where('email', '==', correo))
      .snapshotChanges()
      .pipe(
        map(estudiantes => estudiantes.length > 0)
      );
  }

  async updateEstudiante(estudiante: Estudiante): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }

  // Método para agregar un evento al estudiante
  async agregarEventoAEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayUnion(eventoId)
    });
  }

  // Método para eliminar un evento del estudiante
  async eliminarEventoDeEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayRemove(eventoId)
    });
  }
  async obtenerEstudiantePorId(id: string): Promise<Estudiante | null> {
    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(id).get().toPromise();

      if (estudianteDoc && estudianteDoc.exists) { // Verifica que estudianteDoc no sea undefined y que exista
        const estudianteData = estudianteDoc.data() as Estudiante;
        estudianteData.id_estudiante = estudianteDoc.id; // Asigna el ID al objeto
        return estudianteData;
      }

      return null; // Si no existe el documento, devuelve null
    } catch (error) {
      console.error('Error al obtener el estudiante por ID:', error);
      throw error; // Propaga el error hacia el llamador
    }
  }
}
