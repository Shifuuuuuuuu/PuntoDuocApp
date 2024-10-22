import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { Evento } from '../interface/IEventos';
import { QRCodeData2 } from '../interface/IQR';
import { Estudiante } from '../interface/IEstudiante';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor(public firestore: AngularFirestore, private authService: AuthService) {}
  async getInscripciones(eventId: string): Promise<any[]> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData && eventData.Inscripciones) {
          return eventData.Inscripciones.map(inscripcion => ({
            Nombre_completo: inscripcion.Nombre_completo,
            id_estudiante: inscripcion.id_estudiante || null,
            id_invitado: inscripcion.id_invitado || null
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

  async verifyAndUpdateInscription(qrData: QRCodeData2, eventId: string): Promise<boolean> {
    try {
      const eventSnapshot = await this.firestore.collection('Eventos').doc(eventId).get().toPromise();

      if (eventSnapshot && eventSnapshot.exists) {
        const eventData = eventSnapshot.data() as Evento | undefined;

        if (eventData) {
          const inscripciones = eventData?.Inscripciones || [];
          const index = inscripciones.findIndex(
            (inscripcion) =>
              (inscripcion.id_estudiante && inscripcion.id_estudiante === qrData.id_estudiante) ||
              (inscripcion.id_invitado && inscripcion.id_invitado === qrData.id_Invitado) ||
              (inscripcion.Nombre_completo === qrData.Nombre_completo)
          );

          if (index !== -1) {
            inscripciones[index].verificado = true;

            // Incrementar puntaje solo si es un estudiante
            if (qrData.id_estudiante) {
              console.log('ID de Estudiante:', qrData.id_estudiante); // Verificación de ID
              await this.incrementarPuntajeEstudiante(qrData.id_estudiante, 200);
            }

            await this.firestore.collection('Eventos').doc(eventId).update({
              Inscripciones: inscripciones,
            });

            return true; // Se actualizó correctamente
          } else {
            console.log('El usuario no está inscrito en el evento');
            return false;
          }
        } else {
          console.log('No se encontraron datos del evento');
          return false;
        }
      } else {
        console.log('Evento no encontrado');
        return false;
      }
    } catch (error) {
      console.error('Error al verificar inscripción:', error);
      return false; // Retornamos false si ocurre un error
    }
  }

  async incrementarPuntajeEstudiante(estudianteId: string, puntos: number): Promise<void> {
    try {
      // Obtener el documento del estudiante
      const estudianteDocRef = this.firestore.collection('Estudiantes').doc(estudianteId);

      // Obtener los datos actuales del estudiante
      const estudianteSnapshot = await estudianteDocRef.get().toPromise();

      // Verificar si el snapshot existe y no es undefined
      if (!estudianteSnapshot || !estudianteSnapshot.exists) {
        throw new Error('Estudiante no encontrado');
      }

      const estudianteData = estudianteSnapshot.data() as Estudiante;

      // Obtener el puntaje actual o inicializarlo en 0
      const puntajeActual = estudianteData?.puntaje || 0;

      // Incrementar el puntaje
      const nuevoPuntaje = puntajeActual + puntos;

      // Actualizar solo el campo 'puntaje' utilizando set con merge para no sobrescribir otros datos
      await estudianteDocRef.set({ puntaje: nuevoPuntaje }, { merge: true });

      console.log(`Puntaje actualizado: ${nuevoPuntaje} para el estudiante con ID ${estudianteId}`);
    } catch (error) {
      console.error('Error al actualizar el puntaje:', error);
      throw error;
    }
  }

}




