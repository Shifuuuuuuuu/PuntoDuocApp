import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import Swal from 'sweetalert2';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
@Injectable({
  providedIn: 'root'
})
export class MissionsAlertService {
  constructor(private firestore: AngularFirestore) {}

  // Mostrar misiones
  async showMissionsAlert() {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      Swal.fire('Error', 'No se pudo identificar al usuario.', 'error');
      return;
    }

    const missions = await this.getMissionsFromDatabase(userId);

    if (missions.length === 0) {
      Swal.fire('Sin misiones', 'No hay misiones disponibles en este momento.', 'info');
      return;
    }

    const topMissions = missions.slice(0, 3);

    for (const mission of topMissions) {
      mission.progress = await this.checkMissionProgress(mission, userId);
    }

    const missionHtml = topMissions
      .map((mission) => `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h4 style="margin: 0 0 8px;">${mission.titulo}</h4>
          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">${mission.descripcion}</p>
          <p style="margin: 0 0 10px; font-size: 14px; color: #333;">Objetivo: ${mission.objetivo}</p>
          <progress value="${mission.progress}" max="1" style="width: 100%; height: 10px; margin-bottom: 10px; border-radius: 5px;"></progress>
          <button
            style="
              display: block;
              width: 100%;
              padding: 10px;
              background-color: ${mission.progress < 1 ? '#d3d3d3' : '#007bff'};
              color: ${mission.progress < 1 ? '#999' : '#fff'};
              border: none;
              border-radius: 5px;
              cursor: ${mission.progress < 1 ? 'not-allowed' : 'pointer'};
              font-size: 14px;
              text-transform: uppercase;
            "
            ${mission.progress < 1 ? 'disabled' : ''}
            onclick="window.claimReward('${mission.id}', ${mission.puntaje})">
            Reclamar ${mission.puntaje} puntos
          </button>
        </div>
      `)
      .join('');

    Swal.fire({
      title: 'Misiones',
      html: missionHtml,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'missions-popup',
      },
    });
  }

  // Obtener misiones desde Firestore
  private async getMissionsFromDatabase(userId: string): Promise<any[]> {
    try {
      const missionsSnapshot = await this.firestore.collection('Misiones').get().toPromise();

      if (!missionsSnapshot || missionsSnapshot.empty) {
        console.log('No se encontraron misiones en la base de datos.');
        return [];
      }

      const completedMissions = await this.getCompletedMissions(userId);

      return missionsSnapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          console.log('Misión obtenida:', data);
          return {
            id: doc.id,
            ...data,
          };
        })
        .filter((mission) => !completedMissions.includes(mission.id));
    } catch (error) {
      console.error('Error al obtener misiones:', error);
      return [];
    }
  }

  // Obtener misiones completadas del estudiante
  private async getCompletedMissions(userId: string): Promise<string[]> {
    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(userId).get().toPromise();
      const estudianteData = estudianteDoc?.data() as { misionesCompletadas?: string[] };
      console.log('Misiones completadas:', estudianteData?.misionesCompletadas || []);
      return estudianteData?.misionesCompletadas || [];
    } catch (error) {
      console.error('Error al obtener misiones completadas:', error);
      return [];
    }
  }

  // Reclamar recompensa con mensaje de éxito
  async claimReward(missionId: string, points: number) {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      Swal.fire('Error', 'No se pudo identificar al usuario.', 'error');
      return;
    }

    try {
      console.log(`Reclamando recompensa para la misión: ${missionId}, puntos: ${points}`);
      await this.firestore.collection('Estudiantes').doc(userId).update({
        puntaje: firebase.firestore.FieldValue.increment(points),
        misionesCompletadas: firebase.firestore.FieldValue.arrayUnion(missionId),
      });

      Swal.fire({
        title: '¡Recompensa reclamada!',
        text: `Has ganado ${points} puntos por completar la misión.`,
        icon: 'success',
        confirmButtonText: '¡Genial!',
      });

      this.showMissionsAlert(); // Refresca las misiones
    } catch (error) {
      console.error('Error al reclamar recompensa:', error);
      Swal.fire('Error', 'No se pudo reclamar la recompensa. Inténtalo nuevamente.', 'error');
    }
  }

  // Verificar progreso de cada misión
  private async checkMissionProgress(mission: any, userId: string): Promise<number> {
    try {
      let progress = 0;

      if (mission.objetivo.includes('evento inscrito')) {
        const inscripcionesSnapshot = await this.firestore
          .collection('Inscripciones', ref =>
            ref.where('userId', '==', userId).where('tipoUsuario', '==', 'Estudiante')
          )
          .get()
          .toPromise();

        console.log(`Inscripciones encontradas:`, inscripcionesSnapshot?.docs.map(doc => doc.data()));

        const totalInscritos = inscripcionesSnapshot?.size || 0;
        const requiredInscritos = parseInt(mission.objetivo.match(/\d+/)?.[0] || '1', 10);
        progress = Math.min(totalInscritos / requiredInscritos, 1);

        console.log(`Progreso para misión "${mission.titulo}":`, progress);
      }

      return progress;
    } catch (error) {
      console.error('Error al calcular el progreso de la misión:', error);
      return 0;
    }
  }

  // Obtener el ID del usuario actual
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const userEmail = localStorage.getItem('currentUserEmail');
      if (userEmail) {
        const studentSnapshot = await this.firestore
          .collection('Estudiantes', ref => ref.where('email', '==', userEmail))
          .get()
          .toPromise();

        if (studentSnapshot && !studentSnapshot.empty) {
          console.log('Usuario encontrado:', studentSnapshot.docs[0].id);
          return studentSnapshot.docs[0].id;
        }
      }

      console.warn('No se encontró un usuario actual en localStorage.');
      return null;
    } catch (error) {
      console.error('Error al obtener el ID del usuario actual:', error);
      return null;
    }
  }
}
