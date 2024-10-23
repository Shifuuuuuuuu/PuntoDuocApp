import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Recompensa } from './interface/IRecompensa';

@Injectable({
  providedIn: 'root'
})
export class RecompensaService {
  constructor(private firestore: AngularFirestore) {}

  // Obtener recompensas
  getRecompensas() {
    return this.firestore.collection<Recompensa>('Recompensas').valueChanges({ idField: 'id_recompensa' });
  }

  // Actualizar cantidad de recompensa
  updateRecompensaCantidad(id_recompensa: string, cantidad: number) {
    return this.firestore.collection('Recompensas').doc(id_recompensa).update({ cantidad });
  }
}