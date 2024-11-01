import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Recompensa } from '../interface/IRecompensa'; // Asegúrate de tener la interfaz creada
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EstudianteSinPassword } from '../interface/IEstudiante';

@Injectable({
  providedIn: 'root'
})
export class RecompensaService {

  async getRecompensas(): Promise<Recompensa[]> {
    try {
      const snapshot = await this.firestore.collection<Recompensa>('Recompensas').get().toPromise();

      // Verifica si el snapshot existe y tiene documentos
      if (!snapshot || snapshot.empty) {
        console.warn('No se encontraron recompensas');
        console.log(localStorage.getItem('currentUserEmail'));  // Pa
        return []; // Retorna un array vacío si no hay recompensas
      }

      return snapshot.docs.map(doc => {
        const data = doc.data() as Recompensa;
        return { id_recompensa: doc.id, ...data }; // Incluye el ID de la recompensa
      });
    } catch (error) {
      console.error('Error al obtener las recompensas:', error);
      throw error; // Lanza el error para manejarlo en el componente
    }
  }
  constructor(private firestore: AngularFirestore) { }

  // Agregar una nueva recompensa
async agregarRecompensa(recompensa: Recompensa): Promise<void> {
  try {
    // 1. Agregar la recompensa y obtener el documento
    const docRef = await this.firestore.collection<Recompensa>('Recompensas').add(recompensa);
    
    // 2. Obtener el ID del documento creado
    const id_recompensa = docRef.id;
    
    // 3. Actualizar el documento con el id_recompensa
    await this.firestore.collection<Recompensa>('Recompensas').doc(id_recompensa).update({
      id_recompensa: id_recompensa
    });

    console.log('Recompensa agregada con éxito');
  } catch (error) {
    console.error('Error al agregar la recompensa:', error);
    throw error;
  }

  }
    // Método para obtener la recompensa por ID
    getRecompensaById(id: string | undefined ) {
      return this.firestore.collection<Recompensa>('Recompensas').doc(id).get();
    }
  
    async actualizarRecompensa(id: string, data: Partial<Recompensa>) {
      await this.firestore.collection('Recompensas').doc(id).update(data);
    }
  
    // Método para actualizar el puntaje del estudiante
    actualizarPuntajeEstudiante(idEstudiante: string, nuevoPuntaje: number) {
      return this.firestore.collection('Estudiantes').doc(idEstudiante).update({
        puntaje: nuevoPuntaje
      });
    }
    obtenerRecompensasPorEstudiante(id_estudiante: string): Observable<Recompensa[]> {
      return this.firestore.collection<Recompensa>('Recompensas', ref =>
        ref.where('estudiantesReclamaron', 'array-contains', { id_estudiante, reclamado: false })
      ).valueChanges();
    }
  }

