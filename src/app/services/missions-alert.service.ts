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
      .map((mission, index) => `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h4 style="margin: 0 0 8px;">${mission.titulo}</h4>
          <p style="margin: 0 0 10px; font-size: 14px; color: #666;">${mission.descripcion}</p>
          <p style="margin: 0 0 10px; font-size: 14px; color: #333;">Objetivo: ${mission.objetivo}</p>
          <progress value="${mission.progress}" max="1" style="width: 100%; height: 10px; margin-bottom: 10px; border-radius: 5px;"></progress>
          <button
            id="claim-button-${index}"
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
          >
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

    // Agregar manejadores de eventos a los botones generados
    topMissions.forEach((mission, index) => {
      const button = document.getElementById(`claim-button-${index}`);
      if (button) {
        button.addEventListener('click', async () => {
          try {
            console.log(`Intentando reclamar misión: ${mission.titulo}`);
            await this.claimReward(mission.id, mission.puntaje, userId);
          } catch (error) {
            console.error(`Error al reclamar misión "${mission.titulo}":`, error);
          }
        });
      }
    });
  }

  async claimReward(missionId: string, puntaje: number, userId: string) {
    try {
      const studentDoc = await this.firestore.collection('Estudiantes').doc(userId).get().toPromise();

      if (!studentDoc || !studentDoc.exists) {
        Swal.fire('Error', 'No se encontró información del estudiante.', 'error');
        return;
      }

      const studentData = studentDoc.data() as {
        id_estudiante?: string;
        email: string;
        Nombre_completo: string;
      };

      const { id_estudiante, Nombre_completo, email } = studentData;

      await this.firestore.collection('Estudiantes').doc(userId).update({
        puntaje: firebase.firestore.FieldValue.increment(puntaje),
        misionesCompletadas: firebase.firestore.FieldValue.arrayUnion(missionId),
      });

      await this.firestore.collection('Misiones').doc(missionId).update({
        misionesCompletadas: firebase.firestore.FieldValue.arrayUnion({
          id_estudiante: id_estudiante || userId,
          Nombre_completo,
          email,
          missionId,
        }),
      });

      Swal.fire({
        title: '¡Recompensa reclamada!',
        text: `Has ganado ${puntaje} puntos por completar la misión.`,
        icon: 'success',
        confirmButtonText: '¡Genial!',
      });

      this.showMissionsAlert();
    } catch (error) {
      console.error('Error al reclamar recompensa:', error);
      Swal.fire('Error', 'No se pudo reclamar la recompensa. Inténtalo nuevamente.', 'error');
    }
  }

  private async getMissionsFromDatabase(userId: string): Promise<any[]> {
    try {
      const missionsSnapshot = await this.firestore.collection('Misiones').get().toPromise();

      if (!missionsSnapshot || missionsSnapshot.empty) {
        console.log('No se encontraron misiones en la base de datos.');
        return [];
      }

      const completedMissions = await this.getCompletedMissions(userId);

      return missionsSnapshot.docs
        .map(doc => {
          const data = doc.data() || {};
          return { id: doc.id, ...data };
        })
        .filter(mission => !completedMissions.includes(mission.id));
    } catch (error) {
      console.error('Error al obtener misiones:', error);
      return [];
    }
  }

  private async getCompletedMissions(userId: string): Promise<string[]> {
    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(userId).get().toPromise();

      if (!estudianteDoc || !estudianteDoc.exists) {
        console.warn('El estudiante no existe en la base de datos.');
        return [];
      }

      const estudianteData = estudianteDoc.data() as { misionesCompletadas?: string[] } || {};
      return estudianteData.misionesCompletadas || [];
    } catch (error) {
      console.error('Error al obtener misiones completadas:', error);
      return [];
    }
  }

  private async checkMissionProgress(mission: any, userId: string): Promise<number> {
    try {
        let progress = 0;

        console.log(`Iniciando verificación de progreso para misión: "${mission.titulo}"`);

        // Verificar inscripciones
        if (mission.objetivo.includes('evento inscrito')) {
            const inscripcionesSnapshot = await this.firestore
                .collection('Inscripciones', ref => ref.where('userId', '==', userId))
                .get()
                .toPromise();

            if (inscripcionesSnapshot && !inscripcionesSnapshot.empty) {
                console.log(`Inscripciones encontradas para usuario (${userId}):`, inscripcionesSnapshot.docs.length);

                const requiredInscritos = parseInt(mission.objetivo.match(/\d+/)?.[0] || '0', 10);

                if (!isNaN(requiredInscritos) && requiredInscritos > 0) {
                    const totalInscritos = inscripcionesSnapshot.size;
                    progress = Math.min(totalInscritos / requiredInscritos, 1);
                    console.log(`Progreso de inscripciones (${totalInscritos} / ${requiredInscritos}):`, progress);
                } else {
                    console.warn(`El objetivo de la misión no tiene un número válido.`);
                }
            } else {
                console.log(`No se encontraron inscripciones para el usuario (${userId}).`);
            }
        }

        // Verificar eventos verificados
        if (mission.objetivo.includes('evento verificado')) {
            const eventosSnapshot = await this.firestore
                .collection('Inscripciones', ref =>
                    ref.where('userId', '==', userId).where('verificado', '==', true)
                )
                .get()
                .toPromise();

            if (eventosSnapshot && !eventosSnapshot.empty) {
                console.log(`Eventos verificados encontrados para usuario (${userId}):`, eventosSnapshot.docs.length);

                const requiredVerificados = parseInt(mission.objetivo.match(/\d+/)?.[0] || '0', 10);

                if (!isNaN(requiredVerificados) && requiredVerificados > 0) {
                    const totalVerificados = eventosSnapshot.size;
                    progress = Math.min(totalVerificados / requiredVerificados, 1);
                    console.log(`Progreso de eventos verificados (${totalVerificados} / ${requiredVerificados}):`, progress);
                } else {
                    console.warn(`El objetivo de la misión no tiene un número válido.`);
                }
            } else {
                console.log(`No se encontraron eventos verificados para el usuario (${userId}).`);
            }
        }

        // Verificar comentarios
        if (mission.objetivo.includes('comenta')) {
            const eventosSnapshot = await this.firestore
                .collection('Eventos', ref => ref.where('comentarios.userId', '==', userId))
                .get()
                .toPromise();

            if (eventosSnapshot && !eventosSnapshot.empty) {
                console.log(`Comentarios encontrados para usuario (${userId}):`, eventosSnapshot.docs.length);

                const requiredComentarios = parseInt(mission.objetivo.match(/\d+/)?.[0] || '0', 10);

                if (!isNaN(requiredComentarios) && requiredComentarios > 0) {
                    const totalComentarios = eventosSnapshot.size;
                    progress = Math.min(totalComentarios / requiredComentarios, 1);
                    console.log(`Progreso de comentarios (${totalComentarios} / ${requiredComentarios}):`, progress);
                } else {
                    console.warn(`El objetivo de la misión no tiene un número válido.`);
                }
            } else {
                console.log(`No se encontraron comentarios para el usuario (${userId}).`);
            }
        }

        // Verificar favoritos
        if (mission.objetivo.includes('favorito')) {
            const favoritosSnapshot = await this.firestore
                .collection('Eventos', ref => ref.where('favoritos', 'array-contains', userId))
                .get()
                .toPromise();

            if (favoritosSnapshot && !favoritosSnapshot.empty) {
                console.log(`Eventos favoritos encontrados para usuario (${userId}):`, favoritosSnapshot.docs.length);

                const requiredFavoritos = parseInt(mission.objetivo.match(/\d+/)?.[0] || '0', 10);

                if (!isNaN(requiredFavoritos) && requiredFavoritos > 0) {
                    const totalFavoritos = favoritosSnapshot.size;
                    progress = Math.min(totalFavoritos / requiredFavoritos, 1);
                    console.log(`Progreso de favoritos (${totalFavoritos} / ${requiredFavoritos}):`, progress);
                } else {
                    console.warn(`El objetivo de la misión no tiene un número válido.`);
                }
            } else {
                console.log(`No se encontraron eventos favoritos para el usuario (${userId}).`);
            }
        }

        return progress;
    } catch (error) {
        console.error('Error al calcular el progreso de la misión:', error);
        return 0;
    }
}

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const userEmail = localStorage.getItem('currentUserEmail');
      if (!userEmail) {
        console.warn('No se encontró un correo de usuario actual en localStorage.');
        return null;
      }

      const studentSnapshot = await this.firestore
        .collection('Estudiantes', ref => ref.where('email', '==', userEmail))
        .get()
        .toPromise();

      if (!studentSnapshot || studentSnapshot.empty) {
        console.warn('No se encontró un estudiante con el correo proporcionado.');
        return null;
      }

      return studentSnapshot.docs[0]?.id || null;
    } catch (error) {
      console.error('Error al obtener el ID del usuario actual:', error);
      return null;
    }
  }
}

