// historial-eventos.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Evento } from '../interface/IEventos';
import { Inscripcion } from '../interface/IInscripcion';

@Injectable({
  providedIn: 'root'
})
export class HistorialEventosService {
  constructor(private firestore: AngularFirestore) {}

getEstudianteIdByEmail(email: string): Observable<string | null> {
  console.log('Buscando ID del Estudiante con correo:', email); // Log para verificar el correo
  return this.firestore.collection('Estudiantes', ref => ref.where('email', '==', email))
    .snapshotChanges()
    .pipe(
      map(actions => {
        if (actions.length > 0) {
          console.log('Documento encontrado para estudiante:', actions[0].payload.doc.id);
          return actions[0].payload.doc.id;
        } else {
          console.warn('No se encontró ningún documento para el estudiante con este correo.');
          return null;
        }
      })
    );
}

getInvitadoIdByEmail(email: string): Observable<string | null> {
  console.log('Buscando ID del Invitado con correo:', email); // Log para verificar el correo
  return this.firestore.collection('Invitados', ref => ref.where('email', '==', email))
    .snapshotChanges()
    .pipe(
      map(actions => {
        if (actions.length > 0) {
          console.log('Documento encontrado para invitado:', actions[0].payload.doc.id);
          return actions[0].payload.doc.id;
        } else {
          console.warn('No se encontró ningún documento para el invitado con este correo.');
          return null;
        }
      })
    );
}
getEventosVerificados(
  userId: string,
  userType: 'estudiante' | 'invitado'
): Observable<Evento[]> {
  return this.firestore
    .collection('Eventos')
    .snapshotChanges()
    .pipe(
      map((actions) =>
        actions.map((a) => {
          const data = a.payload.doc.data() as Evento; // Usamos la interfaz Evento
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      ),
      map((eventos) =>
        eventos.filter((evento) => {
          // Verificamos si el usuario está inscrito en el evento
          const inscripciones = evento.Inscripciones || [];
          return inscripciones.some(
            (inscripcion: Inscripcion) =>
              (userType === 'estudiante' && inscripcion.id_estudiante === userId) ||
              (userType === 'invitado' && inscripcion.id_invitado === userId)
          );
        })
      ),
      catchError((error) => {
        console.error('Error al obtener eventos verificados:', error);
        return of([]); // Devuelve un array vacío en caso de error
      })
    );
}

}
