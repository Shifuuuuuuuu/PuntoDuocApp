import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { Evento } from '../interface/IEventos';
import { Estudiante } from '../interface/IEstudiante';
import { BehaviorSubject, map, Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Inscripcion } from '../interface/IInscripcion';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private eventosCollection: AngularFirestoreCollection<Evento>;

  // BehaviorSubjects para compartir el estado de verificación y puntaje
  private verificacionEstado = new BehaviorSubject<boolean | null>(null);
  private puntajeEstado = new BehaviorSubject<number>(0);

  verificacionEstado$ = this.verificacionEstado.asObservable();
  puntajeEstado$ = this.puntajeEstado.asObservable();

  constructor(public firestore: AngularFirestore) {
    this.eventosCollection = this.firestore.collection('Eventos');
  }

  // Método para emitir cambios en verificación y puntaje
  emitirVerificacion(verificado: boolean, puntaje: number) {
    this.verificacionEstado.next(verificado);
    this.puntajeEstado.next(puntaje);
  }

  // Método para escuchar cambios en la verificación de inscripciones
  onVerificationChange(eventId: string): Observable<any> {
    return this.eventosCollection.doc(eventId).snapshotChanges().pipe(
      map(snapshot => {
        const eventData = snapshot.payload.data() as Evento | undefined;
        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          const inscripcionesVerificadas = inscripciones.filter(inscripcion => inscripcion.verificado === true);
          return inscripcionesVerificadas;
        } else {
          return [];
        }
      })
    );
  }

  async getInscripciones(eventId: string): Promise<any[]> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData && eventData.Inscripciones) {
          return eventData.Inscripciones.map(inscripcion => ({
            Nombre_completo: inscripcion.Nombre_completo,
            id_estudiante: inscripcion.id_estudiante || null,
            id_invitado: inscripcion.id_invitado || null,
            verificado: inscripcion.verificado || false
          }));
        }
      }

      return []; // Si no hay inscripciones, retornamos un arreglo vacío
    } catch (error) {
      console.error('Error al obtener inscripciones:', error);
      throw error;
    }
  }

  // Obtener la lista de espera por el ID del evento
  async getDatosEvento(eventId: string): Promise<{ inscripciones: any[], listaEspera: any[] }> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData) {
          const inscripciones = eventData.Inscripciones || [];
          const listaEspera = eventData.listaEspera || [];

          // Formatear inscripciones para incluir verificación y nombre completo
          const formattedInscripciones = inscripciones.map(inscripcion => ({
            Nombre_completo: inscripcion.Nombre_completo,
            verificado: inscripcion.verificado || false,
            id_estudiante: inscripcion.id_estudiante || null,
            id_invitado: inscripcion.id_invitado || null
          }));

          return {
            inscripciones: formattedInscripciones,
            listaEspera: listaEspera.map(user => ({
              userName: user.userName
            }))
          };
        }
      }

      return { inscripciones: [], listaEspera: [] }; // Retornar vacío si no existen listas
    } catch (error) {
      console.error('Error al obtener los datos del evento:', error);
      throw error;
    }
  }

  async startScan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17,
        cameraDirection: 1,
      });

      const qrData = result.ScanResult; // Obtener la información del QR (ID y otros datos)
      return JSON.parse(qrData); // Suponiendo que el QR tiene datos en formato JSON
    } catch (e) {
      console.error('Error al escanear el código:', e);
      throw e;
    }
  }

  async getInscripcionVerificada(qrData: any, eventId: string): Promise<any> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          console.log('Inscripciones del evento:', inscripciones);

          // Normaliza las inscripciones
          const normalizedInscripciones = inscripciones.map(inscripcion => ({
            ...inscripcion,
            id_estudiante: inscripcion.id_estudiante?.trim(),
            id_invitado: inscripcion.id_invitado?.trim(),
          }));

          const inscripcion = normalizedInscripciones.find(
            (inscripcion) =>
              (inscripcion.id_estudiante === qrData.userId && qrData.tipoUsuario === 'estudiante') ||
              (inscripcion.id_invitado === qrData.userId && qrData.tipoUsuario === 'invitado')
          );

          if (inscripcion) {
            console.log('Inscripción encontrada:', inscripcion);
          } else {
            console.log('No se encontró inscripción para el usuario.');
          }

          return inscripcion || null;
        }
      }

      console.log('El evento no existe o no se encontraron inscripciones.');
      return null;
    } catch (error) {
      console.error('Error al obtener la inscripción:', error);
      throw error;
    }
  }

  async verifyAndUpdateInscription(qrData: any, eventId: string, fechaVerificacion: Date): Promise<{ verificado: boolean; puntaje?: number }> {
    try {
      console.log('Verificando inscripción para el evento:', eventId);

      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;
        console.log('Datos del evento obtenidos:', eventData);

        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          const index = inscripciones.findIndex(
            (inscripcion) =>
              (inscripcion.id_estudiante === qrData.userId && qrData.tipoUsuario === 'estudiante') ||
              (inscripcion.id_invitado === qrData.userId && qrData.tipoUsuario === 'invitado')
          );

          console.log('Índice de inscripción encontrada:', index);

          if (index !== -1) {
            if (inscripciones[index].verificado) {
              console.log('El usuario ya ha sido verificado previamente.');
              return { verificado: true, puntaje: 0 }; // Retorna si ya está verificado
            }

            // Actualizar estado de verificación y agregar la fecha de verificación
            inscripciones[index].verificado = true;
            inscripciones[index].fechaVerificacion = fechaVerificacion || new Date(); // Usa el parámetro o la fecha actual

            let puntaje = typeof eventData.puntaje === 'string' ? parseInt(eventData.puntaje, 10) : eventData.puntaje;
            console.log('Puntaje del evento:', puntaje);

            if (qrData.tipoUsuario === 'estudiante' && puntaje > 0) {
              console.log('Incrementando puntaje al estudiante con ID:', qrData.userId);
              puntaje = await this.incrementarPuntajeEstudiante(qrData.userId, puntaje);
              console.log('Nuevo puntaje total del estudiante:', puntaje);
            } else if (qrData.tipoUsuario === 'invitado') {
              console.log('El usuario es un invitado, no se sumarán puntos.');
              puntaje = 0;
            }

            // Limpiar datos antes de actualizar Firestore
            const sanitizedInscripciones = inscripciones.map(inscripcion => {
              const sanitized: Partial<Inscripcion> = {};
              (Object.keys(inscripcion) as (keyof Inscripcion)[]).forEach(key => {
                const value = inscripcion[key];
                if (value !== undefined) {
                  (sanitized as any)[key] = value;
                }
              });
              return sanitized;
            });

            // Guardar los cambios en Firestore
            await this.firestore.collection('Eventos').doc(eventId).update({
              Inscripciones: sanitizedInscripciones
            });
            console.log('Inscripciones actualizadas en Firestore');

            return { verificado: true, puntaje: puntaje };
          } else {
            console.log('No se encontró la inscripción para el usuario en el evento.');
            return { verificado: false };
          }
        }
      }

      console.log('El evento no existe o no se encontraron datos.');
      return { verificado: false };
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      return { verificado: false };
    }
  }



async incrementarPuntajeEstudiante(estudianteId: string, puntos: number): Promise<number> {
  try {
    const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);
    const estudianteSnapshot = await estudianteDocRef.get().toPromise();

    if (!estudianteSnapshot || !estudianteSnapshot.exists) {
      throw new Error('Estudiante no encontrado');
    }

    const estudianteData = estudianteSnapshot.data() as Estudiante;
    const puntajeActual = estudianteData?.puntaje || 0;
    const nuevoPuntaje = puntajeActual + puntos;

    console.log('Puntaje actual del estudiante:', puntajeActual);
    console.log('Puntaje que se añadirá:', puntos);
    console.log('Nuevo puntaje calculado:', nuevoPuntaje);

    // Actualizar el puntaje total del estudiante
    await estudianteDocRef.update({ puntaje: nuevoPuntaje });
    console.log('Puntaje actualizado en Firestore');

    // Crear una entrada en el historial de puntajes
    const historialPuntajeEntry = {
      puntaje: puntos,
      fecha: firebase.firestore.FieldValue.serverTimestamp() // Timestamp del servidor para la fecha actual
    };

    // Actualizar el historial de puntajes (suponiendo que `historialPuntaje` es un campo con subcolección)
    await estudianteDocRef.collection('historialPuntaje').add(historialPuntajeEntry);
    console.log('Entrada añadida al historial de puntajes');

    return nuevoPuntaje;
  } catch (error) {
    console.error('Error al actualizar el puntaje:', error);
    throw error;
  }
}


  async getEvento(eventId: string): Promise<Evento | undefined> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        return eventSnapshot.data() as Evento;
      } else {
        console.log('Evento no encontrado');
        return undefined;
      }
    } catch (error) {
      console.error('Error al obtener el evento:', error);
      throw error;
    }
  }
}




