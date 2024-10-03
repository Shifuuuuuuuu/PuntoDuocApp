
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Invitado } from '../interface/IInvitado';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvitadoService {
  private invitadosCollection = this.firestore.collection<Invitado>('Usuario_Invitado');
  public currentUserEmail: string | undefined;// Almacenamiento privado para el correo del usuario actual

  constructor(private firestore: AngularFirestore) {}

  // Registrar un nuevo invitado y devolver el objeto completo con ID
  async registrarInvitado(invitado: Invitado): Promise<Invitado> {
    const docRef = await this.invitadosCollection.add(invitado);
    const invitadoRegistrado: Invitado = {
      ...invitado,
      id_Invitado: docRef.id
    };
    return invitadoRegistrado;
  }

  // Verificar si un invitado existe por su correo electrónico (Observable)
  verificarInvitadoPorCorreo(email: string): Observable<boolean> {
    return this.firestore.collection<Invitado>('Usuario_Invitado', ref => ref.where('email', '==', email))
      .snapshotChanges()
      .pipe(map(snapshot => snapshot.length > 0));
  }

  // Obtener un invitado por su correo electrónico
  async obtenerInvitadoPorEmail(email: string): Promise<Invitado | null> {
    // Verifica que el email no sea undefined o vacío
    if (!email) {
        console.error('El email no puede ser undefined o vacío');
        return null; // Devuelve null si el email no es válido
    }

    try {
        // Realiza la consulta en Firestore para buscar el invitado por email
        const snapshot = await this.invitadosCollection.ref.where('email', '==', email).get();

        // Verifica si se encontraron documentos
        if (!snapshot.empty) {
            const doc = snapshot.docs[0]; // Obtiene el primer documento
            const data = doc.data() as Omit<Invitado, 'id_Invitado'>; // Omitimos 'id_Invitado'

            // Asigna el correo al currentUserEmail
            this.currentUserEmail = email;

            // Devuelve el invitado encontrado
            return { id_Invitado: doc.id, ...data };
        }

        // Si no se encontró ningún invitado, muestra una advertencia y devuelve null
        console.warn('No se encontró ningún invitado con ese email.');
        return null; // Devuelve null si no se encontró el invitado
    } catch (error) {
        // Muestra un error en la consola si ocurre un problema
        console.error('Error al obtener invitado por email:', error);
        return null; // Devuelve null en caso de error
    }
}


  // Actualizar un invitado
  async updateInvitado(invitado: Invitado): Promise<void> {
    if (!invitado.id_Invitado) {
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.invitadosCollection.doc(invitado.id_Invitado).update(invitado);
  }

  // Guardar el código QR generado en el invitado
  async guardarCodigoQr(invitado: Invitado): Promise<void> {
    if(!invitado.id_Invitado){
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.firestore.collection('Usuario_Invitado').doc(invitado.id_Invitado).update(invitado)
  }

  // Método para establecer el correo electrónico actual del usuario invitado
  setCurrentUserEmail(email: string): void {
    this.currentUserEmail = email;
  }

  // Método para obtener el correo electrónico actual del usuario invitado

}

