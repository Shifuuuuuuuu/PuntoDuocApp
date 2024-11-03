// historial-eventos.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
getEventosVerificados(userId: string, userType: 'estudiante' | 'invitado'): Observable<any[]> {
  return this.firestore.collection('Eventos').valueChanges().pipe(
    map((eventos: any[]) => {
      return eventos.filter(evento =>
        evento.Inscripciones?.some((inscripcion: any) =>
          ((inscripcion.id_estudiante === userId && userType === 'estudiante') ||
           (inscripcion.id_Invitado === userId && userType === 'invitado')) &&
          inscripcion.verificado === true
        )
      );
    })
  );
}
}
