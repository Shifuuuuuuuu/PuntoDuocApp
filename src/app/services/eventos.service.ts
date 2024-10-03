import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Evento } from '../interface/IEventos';
@Injectable({
  providedIn: 'root'
})
export class EventosService {
  constructor(private firestore: AngularFirestore) {}

  // Método para inscribir a un usuario a un evento
  async inscribirUsuario(eventoId: string, userId: string) {
    const eventoDoc = await this.firestore.collection('Eventos').doc(eventoId).ref.get();

    if (eventoDoc.exists) {
      const eventoData = eventoDoc.data() as Evento;

      // Verifica si hay cupos disponibles
      if (eventoData.Cupos > eventoData.inscritos) {
        const inscritosActualizados = eventoData.inscritos + 1;

        // Actualiza los datos en Firestore
        await this.firestore.collection('Eventos').doc(eventoId).update({
          inscritos: inscritosActualizados,
          Cupos: eventoData.Cupos - 1
        });

        // Guarda la inscripción del usuario en una colección adicional
        await this.firestore.collection('Inscripciones').add({
          eventoId: eventoId,
          userId: userId,
          timestamp: new Date()
        });
      } else {
        throw new Error('No hay cupos disponibles para este evento.');
      }
    } else {
      throw new Error('Evento no encontrado.');
    }
  }

  // Método para cancelar la inscripción de un usuario a un evento
  async cancelarInscripcion(eventoId: string, userId: string) {
    const inscripcionQuery = this.firestore.collection('Inscripciones', ref => ref.where('eventoId', '==', eventoId).where('userId', '==', userId));
    const inscripciones = await inscripcionQuery.get().toPromise();

    if (inscripciones && !inscripciones.empty) {
      const inscripcionId = inscripciones.docs[0].id;

      // Elimina la inscripción
      await this.firestore.collection('Inscripciones').doc(inscripcionId).delete();

      // Actualiza el evento
      const eventoDoc = await this.firestore.collection('Eventos').doc(eventoId).ref.get();
      if (eventoDoc.exists) {
        const eventoData = eventoDoc.data() as Evento;
        const inscritosActualizados = eventoData.inscritos - 1;

        await this.firestore.collection('Eventos').doc(eventoId).update({
          inscritos: inscritosActualizados,
          Cupos: eventoData.Cupos + 1
        });
      }
    } else {
      throw new Error('No se encontró la inscripción para cancelar.');
    }
  }

  // Método para verificar si un usuario está inscrito en un evento
  async isUserRegistered(eventoId: string, userId: string): Promise<boolean> {
    const inscripciones = await this.firestore.collection('Inscripciones', ref => ref
      .where('eventoId', '==', eventoId)
      .where('userId', '==', userId))
      .get()
      .toPromise();

      return inscripciones !== undefined && !inscripciones.empty;
  }
}
