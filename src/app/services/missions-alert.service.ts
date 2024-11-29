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
                    // Asegurarse de incluir el argumento `categoria`
                    await this.claimReward(mission.id, mission.puntaje, userId, mission.categoria);
                } catch (error) {
                    console.error(`Error al reclamar misión "${mission.titulo}":`, error);
                }
            });
        }
    });
}


async claimReward(missionId: string, puntaje: number, userId: string, categoria: string) {
  try {
      // Obtener datos del estudiante
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

      // Actualizar puntaje y misiones completadas del estudiante
      await this.firestore.collection('Estudiantes').doc(userId).update({
          puntaje: firebase.firestore.FieldValue.increment(puntaje),
          misionesCompletadas: firebase.firestore.FieldValue.arrayUnion(missionId),
      });

      // Lógica para actualizar colecciones relacionadas
      const collectionsToUpdate = [
          { collection: 'Eventos', filterKey: 'Inscripciones', isArray: true },
      ];

      for (const { collection, filterKey, isArray } of collectionsToUpdate) {
          console.log(`Buscando documentos en la colección ${collection}...`);

          const snapshot = await this.firestore.collection(collection).get().toPromise();

          if (snapshot && !snapshot.empty) {
              console.log(`Documentos encontrados en ${collection}: ${snapshot.size}`);
              for (const doc of snapshot.docs) {
                  const data = doc.data() as {
                      Inscripciones?: Array<{ id_estudiante?: string; verificado?: boolean }>;
                      verificadoPorMision?: Array<{ userId: string; utilizado: boolean }>;
                  };

                  console.log(`Datos del documento ${doc.id}:`, data);

                  if (isArray) {
                      const verificadoPorMision = data.verificadoPorMision || [];

                      // Verificar si ya existe una entrada para este usuario
                      if (!verificadoPorMision.some(verificado => verificado.userId === userId && verificado.utilizado)) {
                          await this.firestore.collection(collection).doc(doc.id).update({
                              verificadoPorMision: firebase.firestore.FieldValue.arrayUnion({
                                  missionId,
                                  id_estudiante,
                                  Nombre_completo,
                                  email,
                                  userId,
                                  utilizado: true,
                              }),
                          });
                          console.log(`Actualizado: verificadoPorMision para ${doc.id} en colección ${collection}`);
                      } else {
                          console.log(`Ya verificado o utilizado: ${doc.id} en colección ${collection}`);
                      }
                  }
              }
          } else {
              console.log(`No se encontraron documentos en la colección ${collection}`);
          }
      }

      // Confirmación de éxito
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
        const { categoria, meta } = mission;
        let progress = 0;

        if (!categoria || !meta) {
            console.warn(`La misión "${mission.titulo}" no tiene categoría o meta válida.`);
            return progress;
        }

        console.log(`Procesando misión: ${mission.titulo}`);
        console.log(`ID del usuario actual (estudiante): ${userId}`);
        console.log(`Categoría: ${categoria}, Meta: ${meta}`);

        switch (categoria) {
            case 'Inscripción':
            case 'Verificación':
            case 'Lista de Espera': {
                const eventosSnapshot = await this.firestore.collection('Eventos').get().toPromise();

                if (!eventosSnapshot || eventosSnapshot.empty) {
                    console.log(`No se encontraron eventos para la categoría "${categoria}".`);
                    break;
                }

                let totalCount = 0;
                eventosSnapshot.docs.forEach(doc => {
                    const eventoData = doc.data() as {
                        Inscripciones?: Array<{ id_estudiante?: string; id_invitado?: string }>;
                        verificadoPorMision?: Array<{
                            userId: string;
                            utilizado: boolean;
                            verificado: boolean;
                        }>;
                    };
                    const inscripciones = eventoData?.Inscripciones || [];
                    const verificadoPorMision = eventoData?.verificadoPorMision || [];

                    inscripciones.forEach(inscripcion => {
                        const alreadyUsed = verificadoPorMision.some(verificado => verificado.userId === userId && verificado.utilizado);

                        if (!alreadyUsed) {
                            console.log(`Elemento válido para el progreso: ${doc.id}`);
                            totalCount++;
                        } else {
                            console.log(`Elemento ignorado porque ya está utilizado/verificado: ${doc.id}`);
                        }
                    });
                });

                console.log(`Total encontrados para la categoría "${categoria}": ${totalCount}`);
                progress = Math.min(totalCount / meta, 1);
                console.log(`Progreso (${totalCount} / ${meta}):`, progress);
                break;
            }

            case 'Favoritos': {
                const eventosSnapshot = await this.firestore
                    .collection('Eventos', ref => ref.where('favoritos', 'array-contains', userId))
                    .get()
                    .toPromise();

                if (!eventosSnapshot || eventosSnapshot.empty) {
                    console.log(`No se encontraron eventos favoritos para el usuario.`);
                    break;
                }

                let totalFavoritos = 0;
                eventosSnapshot.docs.forEach(doc => {
                    const eventoData = doc.data() as {
                        verificadoPorMision?: Array<{
                            userId: string;
                            utilizado: boolean;
                            verificado: boolean;
                        }>;
                    };
                    const verificadoPorMision = eventoData?.verificadoPorMision || [];

                    const alreadyUsed = verificadoPorMision.some(verificado => verificado.userId === userId && verificado.utilizado);

                    if (!alreadyUsed) {
                        console.log(`Favorito válido para el progreso: ${doc.id}`);
                        totalFavoritos++;
                    } else {
                        console.log(`Favorito ignorado porque ya está utilizado/verificado: ${doc.id}`);
                    }
                });

                console.log(`Total de favoritos encontrados: ${totalFavoritos}`);
                progress = Math.min(totalFavoritos / meta, 1);
                console.log(`Progreso de favoritos (${totalFavoritos} / ${meta}):`, progress);
                break;
            }

            case 'Comentario': {
                const comentariosSnapshot = await this.firestore
                    .collection('Comentarios', ref => ref.where('id_usuario', '==', userId))
                    .get()
                    .toPromise();

                if (!comentariosSnapshot || comentariosSnapshot.empty) {
                    console.log('No se encontraron comentarios realizados por el usuario.');
                    break;
                }

                let totalComentarios = 0;
                comentariosSnapshot.docs.forEach(doc => {
                    const comentarioData = doc.data() as { verificadoPorMision?: boolean };

                    const isValid = comentarioData.verificadoPorMision !== true;

                    if (isValid) {
                        console.log(`Comentario válido para el progreso: ${doc.id}`);
                        totalComentarios++;
                    } else {
                        console.log(`Comentario ignorado porque ya está verificado: ${doc.id}`);
                    }
                });

                console.log(`Total de comentarios encontrados: ${totalComentarios}`);
                progress = Math.min(totalComentarios / meta, 1);
                console.log(`Progreso de comentarios (${totalComentarios} / ${meta}):`, progress);
                break;
            }

            case 'Consulta':
            case 'Sugerencia': {
                const motivo = categoria === 'Consulta' ? 'Consulta' : 'Sugerencia';
                const consultasSnapshot = await this.firestore
                    .collection('Consultas', ref => ref.where('userId', '==', userId).where('motivo', '==', motivo))
                    .get()
                    .toPromise();

                if (!consultasSnapshot || consultasSnapshot.empty) {
                    console.log(`No se encontraron ${categoria.toLowerCase()}s para el usuario.`);
                    break;
                }

                let totalConsultas = 0;
                consultasSnapshot.docs.forEach(doc => {
                    const consultaData = doc.data() as { verificadoPorMision?: boolean };

                    const isValid = consultaData.verificadoPorMision !== true;

                    if (isValid) {
                        console.log(`${categoria} válida para el progreso: ${doc.id}`);
                        totalConsultas++;
                    } else {
                        console.log(`${categoria} ignorada porque ya está verificada: ${doc.id}`);
                    }
                });

                console.log(`Total de ${categoria.toLowerCase()}s encontrados: ${totalConsultas}`);
                progress = Math.min(totalConsultas / meta, 1);
                console.log(`Progreso de ${categoria.toLowerCase()}s (${totalConsultas} / ${meta}):`, progress);
                break;
            }

            default:
                console.warn(`Categoría "${categoria}" no reconocida.`);
        }

        console.log(`Progreso final para misión "${mission.titulo}": ${progress * 100}%`);
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

