import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {  Observable } from 'rxjs';
import {  filter, map} from 'rxjs/operators';
import { Evento } from '../interface/IEventos';
import { Inscripcion, Inscripcion2 } from '../interface/IInscripcion';
import {  getDoc } from '@angular/fire/firestore';
import { GestorEventos } from '../interface/IGestorEventos';
@Injectable({
  providedIn: 'root'
})
export class EventosGestorService {
  constructor(private firestore: AngularFirestore) { }

  // Obtener lista de eventos
  getEventos(): Observable<Evento[]> {
    return this.firestore.collection<Evento>('Eventos').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Evento;
        const id = a.payload.doc.id; // Obtiene el ID del documento
        return { id, ...data }; // Retorna el evento con el ID del documento incluido
      }))
    );
  }

  getEventoById(id: string): Observable<Evento> {
    return this.firestore.collection('Eventos').doc<Evento>(id).valueChanges().pipe(
      filter((evento: Evento | undefined): evento is Evento => !!evento) // Filtra si es undefined
    );
  }
  // Método para eliminar un evento de Firestore
  eliminarEvento(eventoId: string): Promise<void> {
    return this.firestore.collection('Eventos').doc(eventoId).delete();
  }

  // Verificar inscripción
  verificarInscripcion(eventoId: string, userId: string): Observable<Inscripcion[]> {
    return this.firestore.collection<Inscripcion>('Inscripciones', ref =>
      ref.where('eventoId', '==', eventoId).where('userId', '==', userId)
    ).valueChanges();
  }
  obtenerInscripcion(eventoId: string, idEstudiante: string): Promise<boolean> {
    // Generar el path del documento
    const inscripcionRef = this.firestore.collection('Inscripciones').doc(`${eventoId}_${idEstudiante}`).ref;

    return getDoc(inscripcionRef).then((docSnapshot) => {
      return docSnapshot.exists(); // Retorna true si la inscripción existe
    }).catch((error) => {
      console.error('Error al obtener la inscripción:', error);
      return false; // Retorna false en caso de error
    });
  }

  // Agregar inscripción
  inscribirUsuario(eventoId: string, userId: string) {
    const inscripcion: Inscripcion2 = {
      eventoId: eventoId,
      userId: userId,
      timestamp: new Date()
    };
    return this.firestore.collection('Inscripciones').add(inscripcion);
  }

  actualizarEvento(eventoId: string, data: Partial<Evento>): Promise<void> {
    return this.firestore.collection('Eventos').doc(eventoId).update(data);
  }
}
