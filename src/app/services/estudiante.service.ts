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
  private estudiantesCollection = this.firestore.collection<Estudiante>('estudiantes');

  constructor(private firestore: AngularFirestore) { }

  async registrarEstudiante(estudiante: Estudiante): Promise<Estudiante> {
    const docRef = await this.firestore.collection<Estudiante>('estudiantes').add(estudiante);
    const estudianteRegistrado: Estudiante = {
      ...estudiante,
      id_estudiante: docRef.id
    };
    return estudianteRegistrado;
  }

  verificarEstudiantePorCorreo(correo: string): Observable<boolean> {
    return this.firestore.collection('estudiantes', ref => ref.where('email', '==', correo))
      .snapshotChanges()
      .pipe(
        map(estudiantes => estudiantes.length > 0)
      );
  }

  async updateEstudiante(estudiante: Estudiante): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    await this.firestore.collection('estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }

  // Método para agregar un evento al estudiante
  async agregarEventoAEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayUnion(eventoId)
    });
  }

  // Método para eliminar un evento del estudiante
  async eliminarEventoDeEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayRemove(eventoId)
    });
  }
}
