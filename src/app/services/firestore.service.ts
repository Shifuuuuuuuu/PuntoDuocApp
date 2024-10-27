import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  async getEstudianteByEmail(email: string) {
    try {
        const snapshot = await this.firestore.collection('Estudiantes', ref => ref.where('email', '==', email)).get().toPromise();

        // Asegúrate de que snapshot esté definido
        if (snapshot && !snapshot.empty) {
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data() as any
            };
        }
    } catch (error) {
        console.error('Error fetching student by email:', error);
    }
    
    return null; // Retorna null si no se encuentra el estudiante o hay un error
}
}
