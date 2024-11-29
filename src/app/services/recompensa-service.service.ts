import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Recompensa } from '../interface/IRecompensa'; // Asegúrate de tener la interfaz creada
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecompensaService {
  constructor(private firestore: AngularFirestore) {}

  // Agregar una nueva recompensa
  async agregarRecompensa(recompensa: Recompensa): Promise<void> {
    try {
      // Agrega la recompensa a Firestore
      const docRef = await this.firestore.collection<Recompensa>('Recompensas').add(recompensa);

      // Actualiza el documento con el ID generado
      const id_recompensa = docRef.id;
      await this.firestore.collection<Recompensa>('Recompensas').doc(id_recompensa).update({
        id_recompensa: id_recompensa,
      });

      console.log('Recompensa agregada con éxito');
    } catch (error) {
      console.error('Error al agregar la recompensa:', error);
      throw error;
    }
  }

  // Obtener todas las recompensas
  async getRecompensas(): Promise<Recompensa[]> {
    try {
      const snapshot = await this.firestore.collection<Recompensa>('Recompensas').get().toPromise();

      if (!snapshot || snapshot.empty) {
        console.warn('No se encontraron recompensas');
        return [];
      }

      return snapshot.docs.map((doc) => {
        const data = doc.data() as Recompensa;
        return { id_recompensa: doc.id, ...data }; // Incluye el ID de la recompensa
      });
    } catch (error) {
      console.error('Error al obtener las recompensas:', error);
      throw error;
    }
  }

  // Obtener recompensa por ID
  getRecompensaById(id: string | undefined) {
    return this.firestore.collection<Recompensa>('Recompensas').doc(id).get();
  }


  // Actualizar recompensa
  async actualizarRecompensa(id: string, data: Partial<Recompensa>): Promise<void> {
    try {
      await this.firestore.collection('Recompensas').doc(id).update(data);
      console.log('Recompensa actualizada con éxito');
    } catch (error) {
      console.error('Error al actualizar la recompensa:', error);
      throw error;
    }
  }
}
