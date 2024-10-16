import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Evento } from '../interface/IEventos';
import 'firebase/firestore'; // Importar Firestore
import {doc,updateDoc,arrayUnion,arrayRemove,increment,serverTimestamp,deleteDoc,getDoc,} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  constructor(private firestore: AngularFirestore) {}

  async inscribirUsuario(eventoId: string, userId: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoDoc = await getDoc(eventoDocRef);

    if (eventoDoc.exists()) {
      const eventoData = eventoDoc.data() as Evento;

      // Verifica si hay cupos disponibles
      if (eventoData.Cupos > 0) {
        // Actualiza los cupos y el número de inscritos
        await updateDoc(eventoDocRef, {
          Cupos: increment(-1),
          inscritos: increment(1),
        });

        // Guarda la inscripción del usuario en la colección 'Inscripciones'
        const inscripcionesRef = this.firestore.collection('Inscripciones');
        await inscripcionesRef.add({
          eventoId: eventoId,
          userId: userId,
          timestamp: serverTimestamp(),
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
    const inscripcionesRef = this.firestore.collection('Inscripciones', (ref) =>
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
        inscritos: increment(-1),
      });

      // Gestiona la lista de espera
      await this.verificarListaEspera(eventoId);
    } else {
      throw new Error('No se encontró la inscripción para cancelar.');
    }
  }


  // Método para verificar si un usuario está inscrito en un evento
  async isUserRegistered(eventoId: string, userId: string): Promise<boolean> {
    try {
      const inscripcionesRef = this.firestore.collection('Inscripciones', (ref) =>
        ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
      );

      const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

      return inscripcionesSnapshot ? !inscripcionesSnapshot.empty : false;
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      return false;
    }
  }

  // Método para agregar a un usuario a la lista de espera
  async agregarUsuarioAListaEspera(eventoId: string, userId: string, userName: string): Promise<void> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        listaEspera: arrayUnion({ userId, userName }), // Agrega el objeto completo
      });
    } catch (error) {
      console.error('Error al agregar a la lista de espera:', error);
      throw error;
    }
  }

  async eliminarUsuarioDeListaEspera(eventoId: string, userId: string, userName: string): Promise<void> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        listaEspera: arrayRemove({ userId, userName }), // Elimina el objeto exacto
      });
    } catch (error) {
      console.error('Error al eliminar de la lista de espera:', error);
      throw error;
    }
  }


  // Método para inscribir a un usuario desde la lista de espera
async inscribirDesdeListaEspera(eventoId: string, usuarioEnEspera: { userId: string; userName: string }): Promise<void> {
  try {
    // Inscribe al usuario
    await this.inscribirUsuario(eventoId, usuarioEnEspera.userId);

    // Elimina al usuario de la lista de espera
    await this.eliminarUsuarioDeListaEspera(eventoId, usuarioEnEspera.userId, usuarioEnEspera.userName);
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
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      const eventoSnapshot = await getDoc(eventoDocRef);

      if (eventoSnapshot && eventoSnapshot.exists()) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.Cupos || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error al obtener los cupos disponibles:', error);
      return 0;
    }
  }
  async obtenerListaEspera(eventoId: string): Promise<{ userId: string; userName: string }[]> {
    if (!eventoId) {
      console.error('Error: Evento ID no puede estar vacío');
      return [];
    }

    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      const eventoSnapshot = await getDoc(eventoDocRef);

      if (eventoSnapshot && eventoSnapshot.exists()) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.listaEspera || [];
      }

      return [];
    } catch (error) {
      console.error('Error al obtener la lista de espera:', error);
      return [];
    }
  }

  async verificarListaEspera(eventoId: string): Promise<void> {
    try {
      const cuposDisponibles = await this.obtenerCuposDisponibles(eventoId);
      if (cuposDisponibles > 0) {
        const listaEspera = await this.obtenerListaEspera(eventoId);
        if (listaEspera.length > 0) {
          const primerUsuarioEnEspera = listaEspera[0];
          await this.inscribirDesdeListaEspera(eventoId, primerUsuarioEnEspera);
          // Aquí podrías notificar al usuario que ha sido inscrito automáticamente
        }
      }
    } catch (error) {
      console.error('Error al verificar la lista de espera:', error);
    }
  }

  // Método para verificar si un usuario está en la lista de espera
async isUserInWaitList(eventoId: string, userId: string): Promise<boolean> {
  try {
    const eventoDoc = await this.firestore.collection('Eventos').doc(eventoId).get().toPromise();

    if (eventoDoc && eventoDoc.exists) {
      const eventoData = eventoDoc.data() as Evento;
      const listaEspera = eventoData.listaEspera || [];
      return listaEspera.some((user: { userId: string; userName: string }) => user.userId === userId);
    }

    return false;
  } catch (error) {
    console.error('Error al verificar lista de espera:', error);
    return false;
  }
}

  async salirDeListaEspera(eventoId: string, userId: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);

    // Elimina al usuario de la lista de espera
    await updateDoc(eventoDocRef, {
      listaEspera: arrayRemove(userId)
    });
  }

}
