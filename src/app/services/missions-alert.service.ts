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

      // Actualizar estado de verificación en eventos relacionados
      const eventosSnapshot = await this.firestore.collection('Eventos').get().toPromise();

      if (eventosSnapshot && !eventosSnapshot.empty) {
          console.log(`Documentos encontrados en la colección de eventos: ${eventosSnapshot.size}`);
          for (const doc of eventosSnapshot.docs) {
              const data = doc.data() as {
                  favoritos?: Array<{ id: string; email: string; nombre: string; tipoUsuario: string; verificado?: boolean }>;
                  verificadoPorMision?: Array<{ userId: string; categoria: string; utilizado: boolean }>;
              };

              const verificadoPorMision = data.verificadoPorMision || [];

              // Verificar si ya existe una entrada para esta misión y categoría
              if (!verificadoPorMision.some(verificado => verificado.userId === userId && verificado.categoria === categoria)) {
                  // Actualizar según la categoría
                  if (categoria === 'Favoritos' && data.favoritos) {
                      const favoritoIndex = data.favoritos.findIndex(fav => fav.id === userId && !fav.verificado);
                      if (favoritoIndex > -1) {
                          // Marcar el favorito como verificado
                          data.favoritos[favoritoIndex].verificado = true;

                          // Agregar la entrada en `verificadoPorMision`
                          await this.firestore.collection('Eventos').doc(doc.id).update({
                              favoritos: data.favoritos,
                              verificadoPorMision: firebase.firestore.FieldValue.arrayUnion({
                                  missionId,
                                  categoria,
                                  id_estudiante,
                                  Nombre_completo,
                                  email,
                                  userId,
                                  utilizado: true,
                              }),
                          });
                          console.log(`Actualizado: verificadoPorMision para la categoría "${categoria}" en el evento ${doc.id}`);
                      }
                  } else if (categoria === 'Inscripción') {
                      // Otras categorías como Inscripción pueden manejarse aquí
                      console.log(`Procesando categoría "${categoria}" para el evento ${doc.id}`);
                      await this.firestore.collection('Eventos').doc(doc.id).update({
                          verificadoPorMision: firebase.firestore.FieldValue.arrayUnion({
                              missionId,
                              categoria,
                              id_estudiante,
                              Nombre_completo,
                              email,
                              userId,
                              utilizado: true,
                          }),
                      });
                  }
              } else {
                  console.log(`Ya existe una entrada verificada para esta categoría (${categoria}) en el evento ${doc.id}`);
              }
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
              try {
                  console.log(`Iniciando cálculo de progreso para la categoría "Favoritos".`);
                  console.log(`ID del usuario: ${userId}`);

                  // Obtener todos los eventos
                  const eventosSnapshot = await this.firestore.collection('Eventos').get().toPromise();

                  if (!eventosSnapshot || eventosSnapshot.empty) {
                      console.log(`No se encontraron eventos en la colección.`);
                      break;
                  }

                  console.log(`Eventos encontrados: ${eventosSnapshot.docs.length}`);

                  let totalFavoritos = 0;

                  for (const doc of eventosSnapshot.docs) {
                      const eventoData = doc.data() as {
                          favoritos?: Array<{ id: string; email: string; nombre: string; tipoUsuario: string; verificado?: boolean }>;
                      };

                      console.log(`Procesando evento con ID: ${doc.id}`);
                      const favoritos = eventoData.favoritos || [];
                      console.log(`Favoritos del evento:`, favoritos);

                      // Verificar si el usuario está en favoritos
                      const favoritoIndex = favoritos.findIndex(fav => fav.id === userId);
                      if (favoritoIndex > -1) {
                          const favorito = favoritos[favoritoIndex];

                          if (!favorito.verificado) {
                              console.log(`Favorito válido para el progreso: ${doc.id}`);
                              totalFavoritos++;

                              // Actualizar el estado del favorito como verificado
                              favoritos[favoritoIndex] = { ...favorito, verificado: true };
                              await this.firestore.collection('Eventos').doc(doc.id).update({ favoritos });
                              console.log(`Favorito marcado como verificado para el evento ${doc.id}`);
                          } else {
                              console.log(`Favorito ya utilizado/verificado para el evento ${doc.id}`);
                          }
                      }
                  }

                  console.log(`Total de favoritos válidos encontrados: ${totalFavoritos}`);
                  progress = Math.min(totalFavoritos / meta, 1);
                  console.log(`Progreso de favoritos (${totalFavoritos} / ${meta}):`, progress);
              } catch (error) {
                  console.error('Error al calcular el progreso de favoritos:', error);
              }
              break;
          }



            case 'Comentario': {
                const comentariosSnapshot = await this.firestore
                    .collection('Comentarios', ref => ref.where('id_usuario', '==', userId))
                    .get()
                    .toPromise();

                if (!comentariosSnapshot || comentariosSnapshot.empty) {
                    break;
                }

                let totalComentarios = 0;
                comentariosSnapshot.docs.forEach(doc => {
                    const comentarioData = doc.data() as { verificadoPorMision?: boolean };

                    const isValid = comentarioData.verificadoPorMision !== true;

                    if (isValid) {

                        totalComentarios++;
                    } else {

                    }
                });


                progress = Math.min(totalComentarios / meta, 1);
                console.log(`Progreso de comentarios (${totalComentarios} / ${meta}):`, progress);
                break;
            }

            case 'Consultas':
            case 'Sugerencia': {
                try {
                    const motivo = categoria === 'Consulta' ? 'Consulta' : 'Sugerencias';

                    console.log(`Iniciando cálculo de progreso para la categoría "${categoria}".`);
                    console.log(`ID del usuario: ${userId}`);
                    console.log(`Motivo para filtro: ${motivo}`);

                    // Consultar Firestore para obtener registros de consultas o sugerencias
                    const consultasSnapshot = await this.firestore
                        .collection('Consultas', ref =>
                            ref.where('userId', '==', userId).where('motivo', '==', motivo)
                        )
                        .get()
                        .toPromise();

                    if (!consultasSnapshot || consultasSnapshot.empty) {
                        console.log(`No se encontraron registros para "${categoria}" con motivo "${motivo}".`);
                        break;
                    }

                    console.log(`Total de registros encontrados para "${categoria}": ${consultasSnapshot.docs.length}`);

                    let totalConsultas = 0;

                    consultasSnapshot.docs.forEach(doc => {
                        const consultaData = doc.data() as { verificadoPorMision?: boolean };

                        console.log(`Procesando documento con ID: ${doc.id}`);
                        console.log(`Datos del documento:`, consultaData);

                        const isValid = consultaData.verificadoPorMision !== true;

                        if (isValid) {
                            console.log(`Registro válido para el progreso: ${doc.id}`);
                            totalConsultas++;
                        } else {
                            console.log(`Registro ignorado porque ya está marcado como verificado: ${doc.id}`);
                        }
                    });

                    console.log(`Total de registros válidos para "${categoria}": ${totalConsultas}`);
                    progress = Math.min(totalConsultas / meta, 1);
                    console.log(`Progreso de "${categoria}" (${totalConsultas} / ${meta}):`, progress);
                } catch (error) {
                    console.error(`Error al calcular el progreso para la categoría "${categoria}":`, error);
                }
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
  async obtenerMisionesCompletadas(userId: string): Promise<any[]> {
    try {
      const estudianteDoc = await this.firestore.collection('Estudiantes').doc(userId).get().toPromise();

      if (!estudianteDoc || !estudianteDoc.exists) {
        console.warn('No se encontró información del estudiante.');
        return [];
      }

      const estudianteData = estudianteDoc.data() as { misionesCompletadas?: string[] };

      if (!estudianteData.misionesCompletadas || estudianteData.misionesCompletadas.length === 0) {
        return [];
      }

      const missionsSnapshot = await this.firestore.collection('Misiones', ref =>
        ref.where(firebase.firestore.FieldPath.documentId(), 'in', estudianteData.misionesCompletadas)
      ).get().toPromise();

      return missionsSnapshot?.docs.map(doc => {
        const data = doc.data() as Record<string, any>; // Especifica el tipo de los datos como objeto genérico
        return {
          id: doc.id,
          ...data,
        };
      }) || [];
    } catch (error) {
      console.error('Error al obtener misiones completadas:', error);
      return [];
    }
  }


}

