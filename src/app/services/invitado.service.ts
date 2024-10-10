
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Invitado } from '../interface/IInvitado';
import { BehaviorSubject, map, Observable } from 'rxjs';
import * as firebase from 'firebase/compat';
import 'firebase/compat/firestore';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class InvitadoService {
  private invitadosCollection = this.firestore.collection<Invitado>('Invitados');

  // Utilizamos BehaviorSubject para manejar el estado del correo electrónico del invitado
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  // Método para registrar un invitado
  async registrarInvitado(invitado: Invitado): Promise<Invitado> {
    const docRef = await this.invitadosCollection.add(invitado);
    const invitadoRegistrado: Invitado = {
      ...invitado,
      id_Invitado: docRef.id
    };
    return invitadoRegistrado;
  }

  // Método para verificar si un invitado existe por correo electrónico
  verificarInvitadoPorCorreo(correo: string): Observable<boolean> {
    return this.firestore.collection('Invitados', ref => ref.where('email', '==', correo))
      .snapshotChanges()
      .pipe(
        map(invitados => invitados.length > 0)
      );
  }

  // Método para obtener un invitado por correo electrónico
  async obtenerInvitadoPorEmail(correo: string): Promise<Invitado | null> {
    console.log('Buscando invitado con email:', correo);
    const invitadoDoc = await this.firestore.collection<Invitado>('Invitados', ref => ref.where('email', '==', correo)).get().toPromise();

    if (invitadoDoc && !invitadoDoc.empty) {
      const invitadoData = invitadoDoc.docs[0].data();
      console.log('Invitado encontrado:', invitadoData);
      return { ...invitadoData, id_Invitado: invitadoDoc.docs[0].id };
    }

    console.log('No se encontró ningún invitado con ese email.');
    return null;
  }

  // Método para actualizar un invitado
  async updateInvitado(invitado: Invitado): Promise<void> {
    if (!invitado.id_Invitado) {
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.invitadosCollection.doc(invitado.id_Invitado).update(invitado);
  }

  // Método para guardar el código QR
  async guardarCodigoQr(invitado: Invitado): Promise<void> {
    if (!invitado.id_Invitado) {
      throw new Error('El invitado no tiene un ID asignado');
    }
    await this.firestore.collection('Invitados').doc(invitado.id_Invitado).update(invitado);
  }

  // Método para obtener el correo electrónico actual del usuario invitado como observable
  getCurrentUserEmail(): Observable<string | undefined> {
    return this.currentUserEmail$;
  }

  // Método para establecer el correo electrónico actual del usuario invitado
  setCurrentUserEmail(email: string): void {
    console.log('InvitadoService: Estableciendo currentUserEmail a', email);
    localStorage.setItem('currentUserEmail', email);
    this.currentUserEmailSubject.next(email);
  }

  // Método para limpiar el correo electrónico al cerrar sesión
  clearCurrentUserEmail(): void {
    console.log('InvitadoService: Limpiando currentUserEmail');
    localStorage.removeItem('currentUserEmail');
    this.currentUserEmailSubject.next(undefined);
  }

  // Métodos para agregar y eliminar eventos
  async agregarEventoAInvitado(invitadoId: string, eventoId: string): Promise<void> {
    const invitadoDocRef = doc(this.firestore.firestore, 'Invitados', invitadoId);
    await updateDoc(invitadoDocRef, {
      eventosInscritos: arrayUnion(eventoId)
    });
  }

  async eliminarEventoDeInvitado(invitadoId: string, eventoId: string): Promise<void> {
    const invitadoDocRef = doc(this.firestore.firestore, 'Invitados', invitadoId);
    await updateDoc(invitadoDocRef, {
      eventosInscritos: arrayRemove(eventoId)
    });
  }

  // Método privado para obtener el correo electrónico desde localStorage
  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }
}

