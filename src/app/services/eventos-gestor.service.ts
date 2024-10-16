import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { filter, Observable } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { Inscripcion } from '../interface/IInscripcion';
import {  getDoc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class EventosGestorService {
  constructor(private firestore: AngularFirestore) { }

  // Obtener lista de eventos
  getEventos(): Observable<Evento[]> {
    return this.firestore.collection<Evento>('Eventos').valueChanges({ idField: 'id' });
  }

  getEventoById(id: string): Observable<Evento> {
    return this.firestore.collection('Eventos').doc<Evento>(id).valueChanges().pipe(
      filter((evento: Evento | undefined): evento is Evento => !!evento) // Filtra si es undefined
    );
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
    const inscripcion: Inscripcion = {
      eventoId: eventoId,
      userId: userId,
      timestamp: new Date()
    };
    return this.firestore.collection('Inscripciones').add(inscripcion);
  }

  // Actualizar evento (ej. para cancelar)
  actualizarEvento(id: string, data: Partial<Evento>) {
    return this.firestore.collection('Eventos').doc(id).update(data);
  }
}
