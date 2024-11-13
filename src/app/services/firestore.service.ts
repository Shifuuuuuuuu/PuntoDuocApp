import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

interface RecompensaData {
    estudiantesReclamaron?: { length: number };  // Asegúrate de que los campos aquí coincidan con la estructura real
}

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

    async getTotalVentas(): Promise<number> {
        try {
          const snapshot = await this.firestore.collection('Recompensas').get().toPromise();
          
          // Verificar que snapshot no sea undefined o vacío
          if (!snapshot || snapshot.empty) {
            console.warn('No se encontraron datos en la colección Recompensas.');
            return 0;
          }
    
          let totalVentas = 0;
          snapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.estudiantesReclamaron) {
              totalVentas += data.estudiantesReclamaron.length;
            }
          });
    
          console.log('Total Ventas:', totalVentas);
          return totalVentas;
        } catch (error) {
          console.error('Error obteniendo el total de ventas:', error);
          throw new Error('No se pudo obtener el total de ventas');
        }
      }
    
      // Obtener el total de recompensas entregadas
      async getRecompensasEntregadas(): Promise<number> {
        try {
          const snapshot = await this.firestore.collection('Recompensas').get().toPromise();
          
          // Verificar que snapshot no sea undefined o vacío
          if (!snapshot || snapshot.empty) {
            console.warn('No se encontraron datos en la colección Recompensas.');
            return 0;
          }
    
          let recompensasEntregadas = 0;
          snapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.estudiantesReclamaron) {
              recompensasEntregadas += data.estudiantesReclamaron.filter((reclamo: any) => reclamo.reclamado === true).length;
            }
          });
    
          console.log('Recompensas Entregadas:', recompensasEntregadas);
          return recompensasEntregadas;
        } catch (error) {
          console.error('Error obteniendo recompensas entregadas:', error);
          throw new Error('No se pudo obtener el total de recompensas entregadas');
        }
      }
    
      // Obtener el total de recompensas pendientes
      async getRecompensasPendientes(): Promise<number> {
        try {
          const snapshot = await this.firestore.collection('Recompensas').get().toPromise();
    
          // Verificar que snapshot no sea undefined o vacío
          if (!snapshot || snapshot.empty) {
            console.warn('No se encontraron datos en la colección Recompensas.');
            return 0;
          }
    
          let recompensasPendientes = 0;
          snapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.estudiantesReclamaron) {
              recompensasPendientes += data.estudiantesReclamaron.filter((reclamo: any) => reclamo.reclamado === false).length;
            }
          });
    
          console.log('Recompensas Pendientes:', recompensasPendientes);
          return recompensasPendientes;
        } catch (error) {
          console.error('Error obteniendo recompensas pendientes:', error);
          throw new Error('No se pudo obtener el total de recompensas pendientes');
        }
      }
    
      // Obtener las top 5 recompensas más reclamadas
      async getTopRecompensas(): Promise<any[]> {
        try {
          const snapshot = await this.firestore.collection('Recompensas').get().toPromise();
      
          // Verificar que snapshot no sea undefined o vacío
          if (!snapshot || snapshot.empty) {
            console.warn('No se encontraron datos en la colección Recompensas.');
            return [];
          }
      
          const recompensas: any[] = [];
          snapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.estudiantesReclamaron) {
              recompensas.push({ id: doc.id, descripcion: data.descripcion, total: data.estudiantesReclamaron.length });
            }
          });
      
          const topRecompensas = recompensas.sort((a, b) => b.total - a.total).slice(0, 5);
          console.log('Top Recompensas:', topRecompensas);
          return topRecompensas;
        } catch (error) {
          console.error('Error obteniendo las recompensas más populares:', error);
          return [];
        }
      }
    
      // Obtener los top 3 estudiantes más activos
      async getTopEstudiantes(): Promise<any[]> {
        try {
          const recompensasSnapshot = await this.firestore.collection('Recompensas').get().toPromise();
          
          if (!recompensasSnapshot || recompensasSnapshot.empty) {
            console.warn('No se encontraron datos en la colección Recompensas.');
            return [];
          }
      
          const estudianteCount: { [key: string]: number } = {};
          recompensasSnapshot.forEach(doc => {
            const data = doc.data() as any;
            if (data.estudiantesReclamaron) {
              data.estudiantesReclamaron.forEach((reclamo: any) => {
                if (!estudianteCount[reclamo.id_estudiante]) {
                  estudianteCount[reclamo.id_estudiante] = 0;
                }
                estudianteCount[reclamo.id_estudiante]++;
              });
            }
          });
      
          const topEstudiantesIds = Object.keys(estudianteCount)
            .map(key => ({ id_estudiante: key, total: estudianteCount[key] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
      
          const estudiantesSnapshot = await this.firestore.collection('Estudiantes').get().toPromise();
          
          if (!estudiantesSnapshot || estudiantesSnapshot.empty) {
            console.warn('No se encontraron datos en la colección Estudiantes.');
            return [];
          }
      
          const estudiantes: { [key: string]: string } = {};
          estudiantesSnapshot.forEach(doc => {
            const data = doc.data() as any;
            estudiantes[doc.id] = data.Nombre_completo;
          });
      
          const topEstudiantes = topEstudiantesIds.map(est => ({
            id_estudiante: est.id_estudiante,
            total: est.total,
            nombre_completo: estudiantes[est.id_estudiante] || 'Nombre no encontrado'
          }));
      
          console.log('Top Estudiantes:', topEstudiantes);
          return topEstudiantes;
      
        } catch (error) {
          console.error('Error obteniendo los mejores estudiantes:', error);
          return [];
        }
      }
      
}
