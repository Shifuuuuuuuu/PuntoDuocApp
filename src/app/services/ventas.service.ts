import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsuarioVentas } from '../interface/IUVentas'; // Asegúrate de colocar la interfaz en la carpeta correcta


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
      console.log("aaaaaaaaaaaaaaaaaa");
      // Limpiar el correo electrónico
      this.currentUserEmailSubject.next(undefined);
      localStorage.removeItem('currentUserEmail');
    } catch (error) {
      console.log("aaaaaaaaaaaaaaaaaa");
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
}

