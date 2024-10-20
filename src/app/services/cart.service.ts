import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { Evento } from '../interface/IEventos';
import { Estudiante } from '../interface/IEstudiante';
import { QRCodeData2 } from '../interface/IQR';
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  constructor(private firestore: AngularFirestore) {}

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
            if (qrData.tipo === 'estudiante' && qrData.id_estudiante) {
              const puntajeIncrementado = await this.incrementarPuntajeEstudiante(qrData.id_estudiante);
              if (puntajeIncrementado) {
                console.log('Puntaje incrementado con éxito.');
              } else {
                console.log('Error al incrementar el puntaje.');
              }
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
          console.log('ID del evento:', eventId);
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

  async incrementarPuntajeEstudiante(estudianteId: string): Promise<boolean> {
    const estudianteDocRef = doc(this.firestore.firestore, 'Estudiantes', estudianteId); // Referencia al documento del estudiante

    try {
      const estudianteDoc = await getDoc(estudianteDocRef); // Obtener el documento del estudiante

      if (estudianteDoc.exists()) {
        const estudianteData = estudianteDoc.data() as Estudiante; // Afirmar el tipo a 'Estudiante'
        const puntajeActual = estudianteData.puntaje || 0; // Acceder a 'puntaje' directamente

        // Actualizar el puntaje sumando 200
        await updateDoc(estudianteDocRef, {
          puntaje: increment(200), // Usar 'increment' para sumar 200
        });

        console.log('Puntaje anterior:', puntajeActual); // Imprimir el puntaje anterior
        console.log('Puntaje incrementado para el estudiante:', estudianteId);
        return true; // Retornamos verdadero si se actualizó correctamente
      } else {
        console.log('Estudiante no encontrado');
        return false; // Retornamos falso si no se encontró el estudiante
      }
    } catch (error) {
      console.error('Error al actualizar el puntaje del estudiante:', error);
      return false; // Retornamos falso si ocurrió un error
    }
  }
}
