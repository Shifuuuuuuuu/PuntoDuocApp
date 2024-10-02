import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import * as QRCode from 'qrcode';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public currentUserEmail!: string; // Agregamos esta variable para almacenar el email del usuario actual
  constructor(private firestore: AngularFirestore) {}

  async login(email: string, password: string): Promise<Estudiante | Invitado | null> {
    // Intentar encontrar un estudiante con el email proporcionado
    const querySnapshot = await this.firestore.collection<Estudiante>('estudiantes', ref =>
      ref.where('email', '==', email)
    ).get().toPromise();

    if (querySnapshot && !querySnapshot.empty) {
      const studentData = querySnapshot.docs[0].data() as Estudiante;

      // Verifica si la contraseña coincide
      if (studentData.password === password) {
        this.currentUserEmail = studentData.email; // Establece el email del usuario
        
        if (studentData.id_estudiante) {
          await this.generateQRCode(studentData.id_estudiante, 'estudiante');
        } else {
          console.error('ID de estudiante no encontrado');
        }

        return studentData; // Devuelve el objeto del estudiante
      } else {
        console.error('Contraseña incorrecta'); // Puedes manejar el error como desees
        return null; // Contraseña incorrecta
      }
    } else {
      // Intentar encontrar un invitado con el email proporcionado
      const guestQuerySnapshot = await this.firestore.collection<Invitado>('Usuario_Invitado', ref =>
        ref.where('email', '==', email)
      ).get().toPromise();

      if (guestQuerySnapshot && !guestQuerySnapshot.empty) {
        const guestData = guestQuerySnapshot.docs[0].data() as Invitado;

        // Verifica si la contraseña coincide
        if (guestData.password === password) {
          this.currentUserEmail = guestData.email; // Establece el email del usuario

          if (guestData.id_Invitado) {
            await this.generateQRCode(guestData.id_Invitado, 'invitado');
          } else {
            console.error('ID de invitado no encontrado');
          }

          return guestData; // Devuelve el objeto del invitado
        } else {
          console.error('Contraseña incorrecta'); // Puedes manejar el error como desees
          return null; // Contraseña incorrecta
        }
      } else {
        console.error('Usuario no encontrado'); // Puedes manejar el error como desees
        return null; // Usuario no encontrado
      }
    }
  }

  private async generateQRCode(userId: string, userType: 'estudiante' | 'invitado'): Promise<void> {
    try {
      const qrData = {
        id: userId,
        type: userType
      };
      const qrString = JSON.stringify(qrData);
      const qrCodeURL = await QRCode.toDataURL(qrString);
      console.log(qrCodeURL); // Aquí puedes manejar el QR code como desees (mostrarlo en la UI, guardarlo, etc.)
    } catch (err) {
      console.error('Error generando el QR code', err);
    }
  }

  

  // Obtener estudiante por email
  async getEstudianteByEmail(email: string): Promise<Estudiante | undefined> {
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
    // Implementa la lógica de cierre de sesión
    this.currentUserEmail = ""; // Limpia el email del usuario actual
    return Promise.resolve(); // Ajusta esto según tu implementación
  }
}
