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

  // Método para inscribir un Estudiante
  async inscribirEstudiante(eventoId: string, userId: string, userName: string, rut: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoDoc = await getDoc(eventoDocRef);

    if (eventoDoc.exists()) {
      const eventoData = eventoDoc.data() as Evento;

      if (eventoData.Cupos > 0) {
        const inscripcion = { id_estudiante: userId, Nombre_completo: userName, Rut: rut };

        await updateDoc(eventoDocRef, {
          Cupos: increment(-1),
          inscritos: increment(1),
          Inscripciones: arrayUnion(inscripcion)
        });

        const inscripcionesRef = this.firestore.collection('Inscripciones');
        await inscripcionesRef.add({
          eventoId: eventoId,
          userId: userId,
          tipoUsuario: 'Estudiante',
          timestamp: serverTimestamp(),
        });
      } else {
        await this.agregarEstudianteAListaEspera(eventoId, userId, userName, rut);
        throw new Error('No hay cupos disponibles. Has sido añadido a la lista de espera.');
      }
    } else {
      throw new Error('Evento no encontrado.');
    }
  }

  // Método para inscribir un Invitado (asegurando uso de id_invitado)
  async inscribirInvitado(eventoId: string, userId: string, userName: string, rut: string): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoDoc = await getDoc(eventoDocRef);

    if (eventoDoc.exists()) {
      const eventoData = eventoDoc.data() as Evento;

      if (eventoData.Cupos > 0) {
        const inscripcion = { id_invitado: userId, Nombre_completo: userName, Rut: rut };

        await updateDoc(eventoDocRef, {
          Cupos: increment(-1),
          inscritos: increment(1),
          Inscripciones: arrayUnion(inscripcion) // usar id_invitado para Invitados
        });

        const inscripcionesRef = this.firestore.collection('Inscripciones');
        await inscripcionesRef.add({
          eventoId: eventoId,
          userId: userId,
          tipoUsuario: 'Invitado',
          timestamp: serverTimestamp(),
        });
      } else {
        await this.agregarInvitadoAListaEspera(eventoId, userId, userName, rut);
        throw new Error('No hay cupos disponibles. Has sido añadido a la lista de espera.');
      }
    } else {
      throw new Error('Evento no encontrado.');
    }
  }

  // Cancelar inscripción para Estudiante
  async cancelarInscripcionEstudiante(eventoId: string, userId: string): Promise<void> {
    const inscripcionesRef = this.firestore.collection('Inscripciones', (ref) =>
      ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
    );

    const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

    if (inscripcionesSnapshot && !inscripcionesSnapshot.empty) {
      const inscripcionId = inscripcionesSnapshot.docs[0].id;
      const inscripcionDocRef = doc(this.firestore.firestore, 'Inscripciones', inscripcionId);
      await deleteDoc(inscripcionDocRef);

      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        Cupos: increment(1),
        inscritos: increment(-1),
        Inscripciones: arrayRemove({ id_estudiante: userId })
      });

      await this.verificarListaEspera(eventoId);
    } else {
      throw new Error('No se encontró la inscripción para cancelar.');
    }
  }

  // Cancelar inscripción para Invitado
  async cancelarInscripcionInvitado(eventoId: string, userId: string): Promise<void> {
    const inscripcionesRef = this.firestore.collection('Inscripciones', (ref) =>
      ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
    );

    const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

    if (inscripcionesSnapshot && !inscripcionesSnapshot.empty) {
      const inscripcionId = inscripcionesSnapshot.docs[0].id;
      const inscripcionDocRef = doc(this.firestore.firestore, 'Inscripciones', inscripcionId);
      await deleteDoc(inscripcionDocRef);

      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        Cupos: increment(1),
        inscritos: increment(-1),
        Inscripciones: arrayRemove({ id_invitado: userId }) // eliminar por id_invitado
      });

      await this.verificarListaEspera(eventoId);
    } else {
      throw new Error('No se encontró la inscripción para cancelar.');
    }
  }

  // Verificar inscripción de Estudiante
  async isUserRegisteredEstudiante(eventoId: string, userId: string): Promise<boolean> {
    try {
      const eventoDocRef = this.firestore.collection('Eventos').doc(eventoId);
      const eventoSnapshot = await eventoDocRef.get().toPromise();

      if (eventoSnapshot && eventoSnapshot.exists) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.Inscripciones?.some((inscripcion) => inscripcion.id_estudiante === userId) || false;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar inscripción de estudiante:', error);
      return false;
    }
  }

  // Verificar inscripción de Invitado
  async isUserRegisteredInvitado(eventoId: string, userId: string): Promise<boolean> {
    try {
      const eventoDocRef = this.firestore.collection('Eventos').doc(eventoId);
      const eventoSnapshot = await eventoDocRef.get().toPromise();

      if (eventoSnapshot && eventoSnapshot.exists) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.Inscripciones?.some((inscripcion) => inscripcion.id_invitado === userId) || false;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar inscripción de invitado:', error);
      return false;
    }
  }

  // Agregar Estudiante a lista de espera
  async agregarEstudianteAListaEspera(eventoId: string, userId: string, userName: string, rut: string): Promise<void> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        listaEspera: arrayUnion({ id_estudiante: userId, Nombre_completo: userName, Rut: rut })
      });
    } catch (error) {
      console.error('Error al agregar estudiante a la lista de espera:', error);
      throw error;
    }
  }

  // Agregar Invitado a lista de espera
  async agregarInvitadoAListaEspera(eventoId: string, userId: string, userName: string, rut: string): Promise<void> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      await updateDoc(eventoDocRef, {
        listaEspera: arrayUnion({ id_Invitado: userId, Nombre_completo: userName, Rut: rut })
      });
    } catch (error) {
      console.error('Error al agregar invitado a la lista de espera:', error);
      throw error;
    }
  }

  // Obtener cupos disponibles
  async obtenerCuposDisponibles(eventoId: string): Promise<number> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      const eventoSnapshot = await getDoc(eventoDocRef);
      if (eventoSnapshot.exists()) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.Cupos || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error al obtener los cupos disponibles:', error);
      return 0;
    }
  }

  // Obtener lista de espera
  async obtenerListaEspera(eventoId: string): Promise<Array<{ userId: string; userName: string; rut: string }>> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      const eventoSnapshot = await getDoc(eventoDocRef);

      if (eventoSnapshot.exists()) {
        const eventoData = eventoSnapshot.data() as Evento;
        return eventoData.listaEspera || [];
      }

      return [];
    } catch (error) {
      console.error('Error al obtener la lista de espera:', error);
      return [];
    }
  }

// Eliminar usuario de lista de espera (maneja estudiante o invitado)
async eliminarUsuarioDeListaEspera(eventoId: string, userId: string): Promise<void> {
  try {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoSnapshot = await getDoc(eventoDocRef);

    if (eventoSnapshot.exists()) {
      const eventoData = eventoSnapshot.data() as Evento;

      // Filtrar la lista de espera para excluir el usuario con el userId proporcionado
      const listaEsperaActualizada = eventoData.listaEspera?.filter((user) => user.userId !== userId);

      await updateDoc(eventoDocRef, { listaEspera: listaEsperaActualizada });
    }
  } catch (error) {
    console.error('Error al eliminar usuario de la lista de espera:', error);
    throw error;
  }
}


// Verificar lista de espera y añadir usuario si hay cupos
async verificarListaEspera(eventoId: string): Promise<void> {
  try {
    const cuposDisponibles = await this.obtenerCuposDisponibles(eventoId);
    if (cuposDisponibles > 0) {
      const listaEspera = await this.obtenerListaEspera(eventoId);
      if (listaEspera.length > 0) {
        const primerUsuarioEnEspera = listaEspera[0];

        if ('id_invitado' in primerUsuarioEnEspera) {
          await this.inscribirInvitado(
            eventoId,
            primerUsuarioEnEspera.userId,
            primerUsuarioEnEspera.userName,
            primerUsuarioEnEspera.rut
          );
        } else if ('id_estudiante' in primerUsuarioEnEspera) {
          await this.inscribirEstudiante(
            eventoId,
            primerUsuarioEnEspera.userId,
            primerUsuarioEnEspera.userName,
            primerUsuarioEnEspera.rut
          );
        }

        // Eliminar al usuario de la lista de espera después de inscribirlo
        await this.eliminarUsuarioDeListaEspera(eventoId, primerUsuarioEnEspera.userId || primerUsuarioEnEspera.userId);
      }
    }
  } catch (error) {
    console.error('Error al verificar la lista de espera:', error);
  }
}
async isUserInWaitList(eventoId: string, userId: string): Promise<boolean> {
  try {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoSnapshot = await getDoc(eventoDocRef);

    if (eventoSnapshot.exists()) {
      const eventoData = eventoSnapshot.data() as Evento;
      const listaEspera = eventoData.listaEspera || [];

      // Verificar si el usuario (ya sea estudiante o invitado) está en la lista de espera
      return listaEspera.some((user) => user.userId === userId);
    }
    return false;
  } catch (error) {
    console.error('Error al verificar si el usuario está en la lista de espera:', error);
    return false;
  }
}
// Eliminar usuario de inscripciones (maneja estudiante o invitado)
async eliminarUsuarioDeInscripciones(eventoId: string, userId: string): Promise<void> {
  try {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoSnapshot = await getDoc(eventoDocRef);

    if (eventoSnapshot.exists()) {
      const eventoData = eventoSnapshot.data() as Evento;

      // Filtrar las inscripciones para excluir el usuario con el userId como estudiante o invitado
      const inscripcionesActualizadas = eventoData.Inscripciones?.filter((inscripcion) => {
        return inscripcion.id_estudiante !== userId && inscripcion.id_invitado !== userId;
      });

      await updateDoc(eventoDocRef, { Inscripciones: inscripcionesActualizadas });
    }
  } catch (error) {
    console.error('Error al eliminar usuario de inscripciones:', error);
    throw error;
  }
}
}



