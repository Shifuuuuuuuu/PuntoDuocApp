import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsuarioVentas } from '../interface/IUVentas'; // Asegúrate de colocar la interfaz en la carpeta correcta
import { Recompensa } from '../interface/IRecompensa';
import Swal from 'sweetalert2';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
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

  async loginWithAuth(email: string, password: string): Promise<UsuarioVentas | null> {
    try {
      // Iniciar sesión con Firebase Authentication
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);

      if (userCredential.user) {
        // Obtener datos adicionales desde Firestore después de la autenticación
        const ventasData = await this.getUsuarioVentasByEmail(email);
        if (ventasData) {
          console.log('Inicio de sesión como usuario de ventas exitoso:', ventasData);
          this.setCurrentUserEmail(email);
          ventasData.id_Uventas = userCredential.user.uid;
          return ventasData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error en VentasAuthService.loginWithAuth:', error);
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

          // Mostrar mensaje de confirmación
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

