import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GestorEventos } from '../interface/IGestorEventos';


@Injectable({
  providedIn: 'root'
})
export class GestorEventosService {
  private currentUserEmailSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(this.getStoredUserEmail());
  public currentUserEmail$: Observable<string | undefined> = this.currentUserEmailSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  private getStoredUserEmail(): string | undefined {
    return localStorage.getItem('currentUserEmail') || undefined;
  }

  setCurrentUserEmail(email: string): void {
    this.currentUserEmailSubject.next(email);
    localStorage.setItem('currentUserEmail', email);
  }

  getCurrentUserEmail(): Observable<string | undefined> {
    return this.currentUserEmail$;
  }

  async login(email: string, password: string): Promise<GestorEventos | null> {
    try {
      const gestoresSnapshot = await this.firestore.collection<GestorEventos>('GestorEventos', ref => ref.where('email', '==', email)).get().toPromise();
      if (gestoresSnapshot && !gestoresSnapshot.empty) {
        const gestorDoc = gestoresSnapshot.docs[0];
        const gestorData = gestorDoc.data() as GestorEventos;

        if (gestorData.password === password) {
          gestorData.id_Geventos = gestorDoc.id;
          this.setCurrentUserEmail(email);
          return gestorData;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error en GestorEventosService.login:', error);
      throw error;
    }
  }
}
