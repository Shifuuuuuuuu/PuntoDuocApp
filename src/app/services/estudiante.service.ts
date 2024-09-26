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

  registrarEstudiante(estudiante: Estudiante) {
    const id = this.firestore.createId(); // Genera un ID único
    estudiante.id_estudiante = id;
    return this.estudiantesCollection.doc(id).set(estudiante); // Guarda el estudiante en Firestore
  }

  verificarEstudiantePorCorreo(correo: string) {
    return this.firestore.collection('estudiantes', ref => ref.where('Correo_electronico', '==', correo))
      .snapshotChanges()
      .pipe(
        map(estudiantes=> estudiantes.length > 0)  // Devuelve true si hay un estudiante registrado con ese correo
      );
  }
}
