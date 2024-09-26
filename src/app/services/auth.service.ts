import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  constructor(private afAuth: AngularFireAuth) {}

  // Método para iniciar sesión
  login(email: string, password: string): Promise<any> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Método para registrar usuario (si lo necesitas)
  register(email: string, password: string): Promise<any> {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  // Método para cerrar sesión
  logout(): Promise<void> {
    return this.afAuth.signOut();
  }
}
