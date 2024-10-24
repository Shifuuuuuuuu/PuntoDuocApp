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
      await this.firestore.collection<Recompensa>('Recompensas').add(recompensa);
      console.log('Recompensa agregada con éxito');
    } catch (error) {
      console.error('Error al agregar la recompensa:', error);
      throw error;
    }
  }
  

  // Obtener todas las recompensas
  obtenerRecompensas(): Observable<Recompensa[]> {
    return this.firestore.collection<Recompensa>('Recompensas').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Recompensa;
        const id = a.payload.doc.id;
        return { id_recompensa: id, ...data };
      }))
    );
  }

  // Obtener una recompensa por ID
  obtenerRecompensaPorId(id: string): Observable<Recompensa | undefined> {
    return this.firestore.collection('Recompensas').doc<Recompensa>(id).valueChanges().pipe(
      map(recompensa => {
        if (recompensa) {
          return { id_recompensa: id, ...recompensa };
        }
        return undefined;
      })
    );
  }

  // Actualizar una recompensa
  async actualizarRecompensa(recompensa: Recompensa): Promise<void> {
    try {
      if (!recompensa.id_recompensa) {
        throw new Error('La recompensa no tiene un ID asignado');
      }
      await this.firestore.collection('Recompensas').doc(recompensa.id_recompensa).update(recompensa);
    } catch (error) {
      console.error('Error al actualizar la recompensa:', error);
      throw error;
    }
  }

  // Eliminar una recompensa
  async eliminarRecompensa(id: string): Promise<void> {
    try {
      await this.firestore.collection('Recompensas').doc(id).delete();
    } catch (error) {
      console.error('Error al eliminar la recompensa:', error);
      throw error;
    }
  }
  async reclamarRecompensa(recompensaId: string, estudiante: EstudianteSinPassword): Promise<void> {
    const recompensaRef = this.firestore.collection('Recompensas').doc(recompensaId);
    const recompensaDoc = await recompensaRef.get().toPromise();

    if (recompensaDoc) {
      const recompensa = recompensaDoc.data() as Recompensa;

      if (estudiante.puntaje >= recompensa.puntos_requeridos && recompensa.cantidad > 0) {
        const reclamacion = {
          id_estudiante: estudiante.id_estudiante!,
          reclamado: false
        };

        const estudiantesReclamaron = recompensa.estudiantesReclamaron || [];
        estudiantesReclamaron.push(reclamacion);

        await recompensaRef.update({
          estudiantesReclamaron,
          cantidad: recompensa.cantidad - 1
        });

        console.log('Recompensa reclamada correctamente.');
      } else {
        console.log('No tienes suficientes puntos o la recompensa no está disponible.');
      }
    } else {
      console.error('Recompensa no encontrada.');
    }
  }


  generarCodigoQR(recompensa: Recompensa, estudiante: EstudianteSinPassword): string {
    // Implementa la lógica para generar el código QR
    // Puede ser una URL con información codificada, o cualquier otro formato
    return `QR_DATA_${recompensa.id_recompensa}_${estudiante.id_estudiante}`;
  }
}

