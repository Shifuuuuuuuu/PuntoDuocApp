import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { Evento } from '../interface/IEventos';
import { QRCodeData2 } from '../interface/IQR';
import { Estudiante } from '../interface/IEstudiante';
import { AuthService } from './auth.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private eventosCollection: AngularFirestoreCollection<Evento>;
  constructor(public firestore: AngularFirestore, private authService: AuthService) {this.eventosCollection = this.firestore.collection('Eventos');}
  // Método para escuchar cambios en la verificación de inscripciones
  onVerificationChange(eventId: string): Observable<any> {
    return this.eventosCollection.doc(eventId).snapshotChanges().pipe(
      map(snapshot => {
        const eventData = snapshot.payload.data() as Evento | undefined;
        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          // Filtrar las inscripciones que han sido verificadas
          const inscripcionesVerificadas = inscripciones.filter(inscripcion => inscripcion.verificado === true);
          return inscripcionesVerificadas; // Retornar solo las inscripciones verificadas
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
      // Accedemos al evento utilizando el eventId
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        // Verificamos si existen las listas en el evento
        const inscripciones = eventData?.Inscripciones || [];
        const listaEspera = eventData?.listaEspera || [];

        // Retornamos ambas listas
        return {
          inscripciones: inscripciones.map(inscripcion => ({
            Nombre_completo: inscripcion.Nombre_completo
          })),
          listaEspera: listaEspera.map(user => ({
            userName: user.userName
          }))
        };
      }

      return { inscripciones: [], listaEspera: [] }; // Retornamos vacíos si no existen las listas
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
              (inscripcion.id_estudiante && inscripcion.id_estudiante === qrData.id_estudiante) ||
              (inscripcion.id_invitado && inscripcion.id_invitado === qrData.id_Invitado)
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
  async verifyAndUpdateInscription(qrData: QRCodeData2, eventId: string): Promise<{ verificado: boolean, puntaje?: number }> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          const index = inscripciones.findIndex(
            (inscripcion) =>
              (inscripcion.id_estudiante && inscripcion.id_estudiante === qrData.id_estudiante) ||
              (inscripcion.id_invitado && inscripcion.id_invitado === qrData.id_Invitado)
          );

          if (index !== -1) {
            // Verificamos si el usuario ya ha sido verificado previamente
            if (inscripciones[index].verificado) {
              console.log('El usuario ya está verificado.');
              return { verificado: true }; // Ya está verificado, no modificamos el puntaje
            }

            // Si no está verificado, procedemos con la verificación
            inscripciones[index].verificado = true;

            // Incrementar puntaje solo si es un estudiante
            let puntaje = 0;
            if (qrData.id_estudiante) {
              console.log('ID de Estudiante:', qrData.id_estudiante); // Verificación de ID
              puntaje = await this.incrementarPuntajeEstudiante(qrData.id_estudiante, 200);
            }

            // Actualizar la inscripción en Firestore
            await this.firestore.collection('Eventos').doc(eventId).update({
              Inscripciones: inscripciones,
            });

            // Retornar que fue verificado con éxito y el puntaje
            return { verificado: true, puntaje: puntaje };
          } else {
            console.log('El usuario no está inscrito en el evento');
            return { verificado: false };
          }
        } else {
          console.log('No se encontraron datos del evento');
          return { verificado: false };
        }
      } else {
        console.log('Evento no encontrado');
        return { verificado: false };
      }
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      return { verificado: false }; // Retornamos false si ocurre un error
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

      // Actualizar solo el campo 'puntaje'
      await estudianteDocRef.update({ puntaje: nuevoPuntaje });

      return nuevoPuntaje; // Asegúrate de retornar el nuevo puntaje
    } catch (error) {
      console.error('Error al actualizar el puntaje:', error);
      throw error;
    }
  }

}




