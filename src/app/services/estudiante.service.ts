import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante'; // Asegúrate de tener la interfaz creada
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  constructor(private firestore: AngularFirestore, private afAuth: AngularFireAuth) { }

  // Registrar estudiante y enviar correo de verificación
  async registrarEstudiante(estudiante: Estudiante): Promise<Omit<Estudiante, 'password'>> {
    // Registrar usuario en Firebase Authentication usando email y password
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(estudiante.email, estudiante.password);

    // Enviar correo de verificación
    await userCredential.user?.sendEmailVerification();

    // Obtener el UID generado por Firebase Authentication
    const uid = userCredential.user?.uid;

    // Crear el objeto estudianteData sin el campo password
    const estudianteData: Omit<Estudiante, 'password'> = {
      email: estudiante.email,
      Nombre_completo: estudiante.Nombre_completo,
      Rut: estudiante.Rut,
      Telefono: estudiante.Telefono,
      carrera: estudiante.carrera,
      puntaje: 0,
      id_estudiante: uid,
      codigoQr: '',  // Puedes dejar esto vacío hasta que lo generes
      eventosInscritos: []
    };

    // Guardar los datos del estudiante en Firestore, excluyendo el password
    await this.firestore.collection<Omit<Estudiante, 'password'>>('Estudiantes').doc(uid).set(estudianteData);

    return estudianteData; // Retornar los datos del estudiante registrado
  }

  // Método para solicitar restablecimiento de contraseña
  async restablecerPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log("Correo de restablecimiento enviado");
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      throw error;
    }
  }

  getUserById(userId: string): Observable<any> {
    return this.firestore.collection('Estudiantes').doc(userId).valueChanges();
  }

  verificarEstudiantePorCorreo(correo: string): Observable<boolean> {
    return this.firestore
      .collection<Estudiante>('Estudiantes', ref => ref.where('email', '==', correo))
      .valueChanges()
      .pipe(
        map(estudiantes => estudiantes.length > 0)
      );
  }

  async updateEstudiante(estudiante: Omit<Estudiante, 'password'>): Promise<void> {
    if (!estudiante.id_estudiante) {
      throw new Error('El estudiante no tiene un ID asignado');
    }
    await this.firestore.collection('Estudiantes').doc(estudiante.id_estudiante).update(estudiante);
  }


  async agregarEventoAEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayUnion(eventoId)
    });
  }

  async eliminarEventoDeEstudiante(estudianteId: string, eventoId: string): Promise<void> {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    await estudianteDocRef.update({
      eventosInscritos: firebase.firestore.FieldValue.arrayRemove(eventoId)
    });
  }

  async obtenerEstudiantePorId(id: string): Promise<Estudiante | null> {
    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(id).get().toPromise();
      if (estudianteDoc && estudianteDoc.exists) {
        const estudianteData = estudianteDoc.data() as Estudiante;
        estudianteData.id_estudiante = estudianteDoc.id;
        return estudianteData;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener el estudiante por ID:', error);
      throw error;
    }
  }
}
