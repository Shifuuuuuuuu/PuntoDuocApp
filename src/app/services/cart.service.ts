import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { Evento } from '../interface/IEventos';
import { Estudiante } from '../interface/IEstudiante';
import { BehaviorSubject, map, Observable } from 'rxjs';

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
          const inscripcion = inscripciones.find(
            (inscripcion) =>
              (inscripcion.id_estudiante === qrData.id_estudiante || inscripcion.id_invitado === qrData.id_Invitado)
          );
          return inscripcion; // Retorna la inscripción que se encontró
        }
      }

      return null; // Si no se encuentra la inscripción
    } catch (error) {
      console.error('Error al obtener la inscripción:', error);
      throw error;
    }
  }

  // Verificar e inscribir al estudiante o invitado
  async verifyAndUpdateInscription(qrData: any, eventId: string): Promise<{ verificado: boolean; puntaje?: number }> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          const index = inscripciones.findIndex(
            (inscripcion) =>
              (inscripcion.id_estudiante === qrData.id_estudiante || inscripcion.id_invitado === qrData.id_Invitado)
          );

          if (index !== -1) {
            if (inscripciones[index].verificado) {
              this.emitirVerificacion(true, 0);
              return { verificado: true };
            }

            inscripciones[index].verificado = true;

            let puntaje = 0;
            if (qrData.id_estudiante) {
              puntaje = await this.incrementarPuntajeEstudiante(qrData.id_estudiante, 200);
            }
            this.emitirVerificacion(true, puntaje);

            await this.firestore.collection('Eventos').doc(eventId).update({
              Inscripciones: inscripciones,
            });

            return { verificado: true, puntaje: puntaje };
          } else {
            this.emitirVerificacion(false, 0);
            return { verificado: false };
          }
        }
      }
      this.emitirVerificacion(false, 0);
      return { verificado: false };
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      this.emitirVerificacion(false, 0);
      return { verificado: false };
    }
  }

  // Método para incrementar puntaje del estudiante
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

      await estudianteDocRef.update({ puntaje: nuevoPuntaje });

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




