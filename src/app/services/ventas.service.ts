import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsuarioVentas } from '../interface/IUVentas'; // Asegúrate de colocar la interfaz en la carpeta correcta
import { Recompensa } from '../interface/IRecompensa';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import Swal from 'sweetalert2';
import { Estudiante } from '../interface/IEstudiante';


@Injectable({
  providedIn: 'root'
})
export class VentasAuthService {
  // BehaviorSubject para manejar el estado del correo electrónico actual
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  // Método privado para obtener el correo electrónico almacenado en localStorage
  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método para establecer el correo electrónico actual del usuario de ventas
  setCurrentUserEmail(email: string): void {
    console.log('VentasAuthService: Estableciendo currentUserEmail a', email);
    this.currentUserEmailSubject.next(email);
    localStorage.setItem('currentUserEmail', email);
    localStorage.setItem('tipousuario', 'ventas');
    

  }

  // Método para obtener el correo electrónico actual de forma síncrona (si está disponible)
  getCurrentUserEmailSync(): string | undefined {
    return this.currentUserEmailSubject.getValue() || localStorage.getItem('currentUserEmail') || undefined;
  }

  // Método de inicio de sesión para usuarios de ventas
  async login(email: string, password: string): Promise<UsuarioVentas | null> {
    try {
      // Buscar al usuario de ventas en la colección 'UVentas' con el email proporcionado
      const ventasSnapshot = await this.firestore.collection<UsuarioVentas>('UVentas', ref => ref.where('email', '==', email)).get().toPromise();

      if (ventasSnapshot && !ventasSnapshot.empty) {
        const ventasDoc = ventasSnapshot.docs[0];
        const ventasData = ventasDoc.data() as UsuarioVentas;

        // Verificar la contraseña (asegúrate de que las contraseñas estén almacenadas de forma segura, preferiblemente hasheadas)
        if (ventasData.password === password) {
          ventasData.id_Uventas = ventasDoc.id;

          // Establecer el correo electrónico en el BehaviorSubject y localStorage
          this.setCurrentUserEmail(email);

          return ventasData;
        } else {
          // Contraseña incorrecta
          return null;
        }
      } else {
        // No se encontró al usuario de ventas
        return null;
      }
    } catch (error) {
      console.error('Error en VentasAuthService.login:', error);
      throw error;
    }
  }

  // Método para cerrar sesión
  async logout(): Promise<void> {
    try {
      // Limpiar el correo electrónico
      this.currentUserEmailSubject.next(undefined);
      localStorage.removeItem('currentUserEmail');
    } catch (error) {
      console.error('Error en VentasAuthService.logout:', error);
      throw error;
    }
  }

  // Método para obtener un usuario de ventas por correo electrónico
  async getUsuarioVentasByEmail(email: string): Promise<UsuarioVentas | null> {
    try {
      const ventasSnapshot = await this.firestore.collection<UsuarioVentas>('UVentas', ref => ref.where('email', '==', email)).get().toPromise();

      if (ventasSnapshot && !ventasSnapshot.empty) {
        const ventasDoc = ventasSnapshot.docs[0];
        const ventasData = ventasDoc.data() as UsuarioVentas;
        ventasData.id_Uventas = ventasDoc.id;
        return ventasData;
      }

      return null;
    } catch (error) {
      console.error('Error en VentasAuthService.getUsuarioVentasByEmail:', error);
      throw error;
    }
  }
  async confirmarReclamacion(id_recompensa: string, id_estudiante: string): Promise<void> {
    try {
      const recompensaDoc = await this.firestore.collection('Recompensas').doc(id_recompensa).get().toPromise();
      if (!recompensaDoc || !recompensaDoc.exists) {
        Swal.fire({
          title: 'Error',
          text: 'No se encontró la recompensa.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
  
      const recompensa = recompensaDoc.data() as Recompensa;
  
      if (recompensa.estudiantesReclamaron) {
        const estudianteIndex = recompensa.estudiantesReclamaron.findIndex(e => e.id_estudiante === id_estudiante);
  
        if (estudianteIndex >= 0) {
          // Cambiar a reclamado
          recompensa.estudiantesReclamaron[estudianteIndex].reclamado = true;
  
          // Mover el estudiante a la última posición
          const estudianteReclamado = recompensa.estudiantesReclamaron[estudianteIndex];
          recompensa.estudiantesReclamaron.splice(estudianteIndex, 1); // Eliminar de su posición actual
          recompensa.estudiantesReclamaron.push(estudianteReclamado); // Agregar al final
  
          // Actualizar la colección
          await this.firestore.collection('Recompensas').doc(id_recompensa).update(recompensa);
  
          // Obtener el documento del estudiante
          const estudianteDoc = await this.firestore.collection('Estudiantes').doc(id_estudiante).get().toPromise();
          if (!estudianteDoc || !estudianteDoc.exists) {
            Swal.fire({
              title: 'Error',
              text: 'No se encontró el estudiante.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            return;
          }
  
          const estudiante = estudianteDoc.data() as Estudiante;
  
          // Restar los puntos requeridos de la recompensa al puntaje del estudiante
          const nuevoPuntaje = estudiante.puntaje - recompensa.puntos_requeridos;
  
          // Actualizar el puntaje del estudiante
          await this.firestore.collection('Estudiantes').doc(id_estudiante).update({ puntaje: nuevoPuntaje });
  
          Swal.fire({
            title: 'Éxito',
            text: `Reclamación de la recompensa "${recompensa.descripcion}" confirmada para el estudiante.`,
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: `El estudiante no ha reclamado la recompensa "${recompensa.descripcion}".`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } else {
        Swal.fire({
          title: 'Error',
          text: `No se encontraron estudiantes que hayan reclamado la recompensa "${recompensa.descripcion}".`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error al confirmar la reclamación de la recompensa:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al confirmar la reclamación de la recompensa. Por favor, inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }
  
  


}

