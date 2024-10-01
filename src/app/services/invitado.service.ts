// src/app/services/invitado.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Invitado } from '../interface/IInvitado';

@Injectable({
  providedIn: 'root'
})
export class InvitadoService {
  private invitadosCollection = this.firestore.collection<Invitado>('Usuario_Invitado');

  constructor(private firestore: AngularFirestore) { }

  // Registrar un nuevo invitado
  registrarInvitado(invitado: Invitado) {
    const id = this.firestore.createId(); // Genera un ID único
    invitado.id_Invitado = id;
    return this.invitadosCollection.doc(id).set(invitado); // Guarda el invitado en Firestore
  }

  // Verificar si un invitado existe por su correo electrónico
  verificarInvitadoPorCorreo(email: string): Promise<boolean> {
    return this.invitadosCollection.ref.where('email', '==', email).get().then(snapshot => !snapshot.empty);
  }

  // Obtener un invitado por su correo electrónico
  async obtenerInvitadoPorEmail(email: string): Promise<Invitado | null> {
    const snapshot = await this.invitadosCollection.ref.where('email', '==', email).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as Omit<Invitado, 'id_Invitado'>; // Omitimos 'id_Invitado'
      return { id_Invitado: doc.id, ...data }; // Combinamos el ID con los datos
    }
    return null;
  }

  // Método adicional para actualizar un invitado
  async updateInvitado(invitado: Invitado): Promise<void> {
    await this.invitadosCollection.doc(invitado.id_Invitado).update(invitado);
  }
}

