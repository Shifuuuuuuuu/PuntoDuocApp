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
 async inscribirEstudiante(
  eventoId: string,
  userId: string,
  userName: string,
  rut: string,
  carrera: string,
  email: string, // Agregado
  verificado: boolean
): Promise<void> {
  const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
  const eventoDoc = await getDoc(eventoDocRef);

  if (eventoDoc.exists()) {
    const eventoData = eventoDoc.data() as Evento;

    if (eventoData.Cupos > 0) {
      const inscripcion = {
        id_estudiante: userId,
        Nombre_completo: userName,
        Rut: rut,
        carrera: carrera,
        email: email, // Agregado
        verificado: verificado,
      };

      await updateDoc(eventoDocRef, {
        Cupos: increment(-1),
        inscritos: increment(1),
        Inscripciones: arrayUnion(inscripcion),
      });

      const inscripcionesRef = this.firestore.collection('Inscripciones');
      await inscripcionesRef.add({
        eventoId: eventoId,
        userId: userId,
        tipoUsuario: 'Estudiante',
        carrera: carrera,
        email: email, // Agregado
        verificado: verificado,
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


  // Método para inscribir un Invitado (si es necesario actualizarlo)
  async inscribirInvitado(
    eventoId: string,
    userId: string,
    userName: string,
    rut: string,
    email: string, // Agregado
    verificado: boolean
  ): Promise<void> {
    const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
    const eventoDoc = await getDoc(eventoDocRef);

    if (eventoDoc.exists()) {
      const eventoData = eventoDoc.data() as Evento;

      if (eventoData.Cupos > 0) {
        const inscripcion = {
          id_invitado: userId,
          Nombre_completo: userName,
          Rut: rut,
          email: email, // Agregado
          verificado: verificado,
        };

        await updateDoc(eventoDocRef, {
          Cupos: increment(-1),
          inscritos: increment(1),
          Inscripciones: arrayUnion(inscripcion),
        });

        const inscripcionesRef = this.firestore.collection('Inscripciones');
        await inscripcionesRef.add({
          eventoId: eventoId,
          userId: userId,
          tipoUsuario: 'Invitado',
          email: email, // Agregado
          verificado: verificado,
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


  async eliminarUsuarioDeListaEspera(eventoId: string, userId: string): Promise<void> {
    try {
      const eventoDocRef = doc(this.firestore.firestore, 'Eventos', eventoId);
      const eventoSnapshot = await getDoc(eventoDocRef);

      if (eventoSnapshot.exists()) {
        const eventoData = eventoSnapshot.data() as Evento;

        // Asegúrate de que listaEspera sea un array vacío si es undefined
        const listaEspera = eventoData.listaEspera || [];


        // Filtrar la lista de espera para excluir al usuario con el ID correspondiente
        const listaEsperaActualizada = listaEspera.filter((user: any) => {
          return user.id_estudiante !== userId && user.id_Invitado !== userId; // Excluir al usuario basado en id_Invitado
        });

        // Verificar si la lista se actualizó correctamente
        if (listaEsperaActualizada.length !== listaEspera.length) {
          // Actualizar la lista de espera en Firestore
          await updateDoc(eventoDocRef, { listaEspera: listaEsperaActualizada });

        } else {
          console.log('No se encontró el usuario en la lista de espera para eliminar.');
        }
      } else {
        console.log('El documento del evento no existe.');
      }
    } catch (error) {
      console.error('Error al eliminar usuario de la lista de espera o al actualizar Firestore:', error);
      throw error;
    }
  }

  async obtenerDatosInvitado(userId: string): Promise<any> {
    try {
      const invitadoDocRef = doc(this.firestore.firestore, 'Invitados', userId);
      const invitadoSnapshot = await getDoc(invitadoDocRef);

      if (invitadoSnapshot.exists()) {
        return invitadoSnapshot.data();
      }
      throw new Error('Invitado no encontrado');
    } catch (error) {
      console.error('Error al obtener datos del invitado:', error);
      throw error;
    }
  }
  async obtenerDatosEstudiante(userId: string): Promise<any> {
    try {
      const estudianteDocRef = doc(this.firestore.firestore, 'Estudiantes', userId);
      const estudianteSnapshot = await getDoc(estudianteDocRef);

      if (estudianteSnapshot.exists()) {
        return estudianteSnapshot.data();
      }
      throw new Error('Estudiante no encontrado');
    } catch (error) {
      console.error('Error al obtener datos del estudiante:', error);
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
        const primerUsuarioEnEspera = listaEspera[0]; // Primer usuario en la lista de espera

        if (primerUsuarioEnEspera.userId.startsWith('invitado_')) {
          // Es un invitado
          const invitado = await this.obtenerDatosInvitado(primerUsuarioEnEspera.userId);
          const email = invitado?.email || '';
          await this.inscribirInvitado(
            eventoId,
            invitado.id_Invitado,
            invitado.Nombre_completo,
            invitado.Rut,
            email, // Agregado
            false
          );
          await this.eliminarUsuarioDeListaEspera(eventoId, invitado.id_Invitado);
        } else if (primerUsuarioEnEspera.userId.startsWith('estudiante_')) {
          // Es un estudiante
          const estudiante = await this.obtenerDatosEstudiante(primerUsuarioEnEspera.userId);
          const carrera = estudiante?.carrera || '';
          const email = estudiante?.email || '';
          await this.inscribirEstudiante(
            eventoId,
            estudiante.id_estudiante,
            estudiante.Nombre_completo,
            estudiante.Rut,
            carrera,
            email, // Agregado
            false
          );
          await this.eliminarUsuarioDeListaEspera(eventoId, estudiante.id_estudiante);
        }
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

      // Verificar si el usuario está en la lista de espera buscando por id_Invitado
      const enListaEspera = listaEspera.some((user: any) => {
        return user.id_Invitado === userId || user.id_estudiante === userId; // Comparar con la propiedad id_Invitado
      });


      return enListaEspera;
    }
    return false;
  } catch (error) {
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



