import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Evento } from '../interface/IEventos';

import 'firebase/firestore'; // Importar Firestore
import { doc, updateDoc, increment, serverTimestamp, deleteDoc, arrayRemove, getFirestore, arrayUnion } from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class EventosService {
 constructor(private firestore: AngularFirestore) {}

  // Método para inscribir a un usuario a un evento
  async inscribirUsuario(eventoId: string, userId: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoDoc = await this.firestore.collection('Eventos').doc(eventoId).ref.get();

    if (eventoDoc.exists) {
      const eventoData = eventoDoc.data() as Evento;

      // Verifica si hay cupos disponibles
      if (eventoData.Cupos > 0) {
        // Actualiza los cupos y el número de inscritos
        await updateDoc(eventoDocRef, {
          Cupos: increment(-1),
          inscritos: increment(1)
        });

        // Guarda la inscripción del usuario en la colección 'Inscripciones'
        const inscripcionesRef = this.firestore.collection('Inscripciones');
        await inscripcionesRef.add({
          eventoId: eventoId,
          userId: userId,
          timestamp: serverTimestamp()
        });
      } else {
        throw new Error('No hay cupos disponibles para este evento.');
      }
    } else {
      throw new Error('Evento no encontrado.');
    }
  }

  // Método para cancelar la inscripción de un usuario a un evento
  async cancelarInscripcion(eventoId: string, userId: string): Promise<void> {
    const inscripcionesRef = this.firestore.collection('Inscripciones', ref =>
      ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
    );

    const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

    if (inscripcionesSnapshot && !inscripcionesSnapshot.empty) {
      const inscripcionId = inscripcionesSnapshot.docs[0].id;

      // Elimina la inscripción
      const inscripcionDocRef = doc(this.firestore.firestore, 'Inscripciones', inscripcionId);
      await deleteDoc(inscripcionDocRef);

      // Actualiza los cupos y el número de inscritos
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        Cupos: increment(1),
        inscritos: increment(-1)
      });

      // Gestiona la lista de espera
      await this.verificarListaEspera(eventoId);
    } else {
      throw new Error('No se encontró la inscripción para cancelar.');
    }
  }

  // Método para verificar si un usuario está inscrito en un evento
  async isUserRegistered(eventoId: string, userId: string): Promise<boolean> {
    const inscripcionesRef = this.firestore.collection('Inscripciones', ref =>
      ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
    );

    const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

    return inscripcionesSnapshot ? !inscripcionesSnapshot.empty : false;
  }

  async agregarUsuarioAListaEspera(eventoId: string, userId: string, userName: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    await updateDoc(eventoDocRef, {
      listaEspera: arrayUnion({ userId, userName })
    });
  }

  // Método para inscribir a un usuario desde la lista de espera
  async inscribirDesdeListaEspera(eventoId: string, userId: string): Promise<void> {
    try {
      // Inscribe al usuario
      await this.inscribirUsuario(eventoId, userId);

      // Elimina al usuario de la lista de espera
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        listaEspera: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error al inscribir desde la lista de espera:', error);
      throw error;
    }
  }

  // Método para obtener los cupos disponibles
  async obtenerCuposDisponibles(eventoId: string): Promise<number> {
    if (!eventoId) {
      console.error('Error: Evento ID no puede estar vacío');
      return 0;
    }

    try {
      const eventoSnapshot = await this.firestore.collection('Eventos').doc(eventoId).ref.get();

      if (eventoSnapshot && eventoSnapshot.exists) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.Cupos || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error al obtener los cupos disponibles:', error);
      return 0;
    }
  }

  // Método para obtener la lista de espera
  async obtenerListaEspera(eventoId: string): Promise<string[]> {
    if (!eventoId) {
      console.error('Error: Evento ID no puede estar vacío');
      return [];
    }

    try {
      const eventoSnapshot = await this.firestore.collection('Eventos').doc(eventoId).ref.get();

      if (eventoSnapshot && eventoSnapshot.exists) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.listaEspera || [];
      }

      return [];
    } catch (error) {
      console.error('Error al obtener la lista de espera:', error);
      return [];
    }
  }

  // Método para verificar y gestionar la lista de espera cuando se libera un cupo
  async verificarListaEspera(eventoId: string): Promise<void> {
    const cuposDisponibles = await this.obtenerCuposDisponibles(eventoId);
    if (cuposDisponibles > 0) {
      const listaEspera = await this.obtenerListaEspera(eventoId);
      if (listaEspera.length > 0) {
        const primerUserId = listaEspera[0];
        await this.inscribirDesdeListaEspera(eventoId, primerUserId);
        // Aquí podrías notificar al usuario que ha sido inscrito automáticamente
      }
    }
  }

}
