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
  return this.firestore.collection('Eventos')
    .snapshotChanges()
    .pipe(
      map(actions => actions
        .map(a => {
          const data = a.payload.doc.data() as any;

          const inscripcionEncontrada = data.Inscripciones.find((inscripcion: any) =>
            (inscripcion.id_estudiante === userId || inscripcion.id_invitado === userId)
          );

          if (inscripcionEncontrada) {
            // Convertir Timestamp de Firestore a Date
            const fechaVerificacion = inscripcionEncontrada.fechaVerificacion?.toDate?.() || null;
            const fechaTermino = data.fecha_termino?.toDate?.() || null;
            const currentDate = new Date(); // Fecha actual

            let estadoVerificacion = 'No Acreditado';
            if (inscripcionEncontrada.verificado) {
              estadoVerificacion = 'Acreditado';
            } else if (fechaTermino && currentDate > fechaTermino) {
              estadoVerificacion = 'Penalizado';
            }

            return {
              ...data,
              fechaVerificacion,
              fechaTermino,
              estadoVerificacion,
            };
          } else {
            return null; // Excluir eventos sin inscripción
          }
        })
        .filter(evento => evento !== null) // Filtrar eventos no válidos
      )
    );
}

}
