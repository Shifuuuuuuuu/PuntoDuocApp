import { Component, OnInit } from '@angular/core';
import { Observable, of, combineLatest, Subscription, firstValueFrom } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { Usuario } from '../interface/IUsuario';
import { AuthService } from '../services/auth.service';
import { EstudianteService } from '../services/estudiante.service';
import { InvitadoService } from '../services/invitado.service';
import { EventosService } from '../services/eventos.service';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Inscripcion, Inscripcion2 } from '../interface/IInscripcion';
@Component({
  selector: 'app-historial-eventos',
  templateUrl: './historial-eventos.page.html',
  styleUrls: ['./historial-eventos.page.scss'],
})
export class HistorialEventosPage implements OnInit {
  inscripciones: any[] = []; // Aquí almacenaremos las inscripciones
  isLoading: boolean = false;
  isInvitado: boolean = false;
  constructor(
    private eventosService: EventosService,
    private toastController: ToastController,
    private firestore: AngularFirestore,
    private router: Router,
    private authService: AuthService,
    private invitadoService: InvitadoService
  ) {}

  ngOnInit() {
    this.loadInscripciones(); // Carga las inscripciones al iniciar
  }

  async doRefresh(event: any) {
    await this.loadInscripciones(); // Vuelve a cargar inscripciones
    event.target.complete();
    const toast = await this.toastController.create({
      message: 'Historial actualizado.',
      duration: 2000,
    });
    toast.present();
  }

  private async loadInscripciones() {
    this.isLoading = true;

    const emailEstudiante = await this.authService.getCurrentUserEmail().toPromise();
    let userId: string | null = null;

    if (emailEstudiante) {
      const estudiante = await this.authService.getEstudianteByEmails(emailEstudiante).toPromise();
      userId = estudiante?.id_estudiante ?? null; // Asigna a userId o null
    } else {
      const emailInvitado = await this.invitadoService.getCurrentUserEmail().toPromise();
      if (emailInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorEmail(emailInvitado).toPromise();
        userId = invitado?.id_Invitado ?? null; // Asigna a userId o null
      }
    }

    if (!userId) {
      console.error('No hay un usuario autenticado.');
      this.isLoading = false;
      return;
    }

    // Obtén todas las inscripciones del usuario
    const inscripcionesRef = this.firestore.collection<Inscripcion2>('Inscripciones', ref =>
      ref.where('userId', '==', userId)
    );

    const inscripcionesSnapshot = await inscripcionesRef.get().toPromise();

    this.inscripciones = []; // Asegúrate de que sea un array vacío

    if (inscripcionesSnapshot && !inscripcionesSnapshot.empty) {
      console.log('Inscripciones encontradas:', inscripcionesSnapshot.docs.length);
      for (const doc of inscripcionesSnapshot.docs) {
        const inscripcion = doc.data() as Inscripcion2; // Especifica el tipo de inscripcion
        console.log('Inscripción:', inscripcion);

        // Obtener detalles del evento usando el eventoId de la inscripción
        const eventoDoc = await this.firestore.collection<Evento>('Eventos').doc(inscripcion.eventoId).get().toPromise();

        // Verifica si eventoDoc existe y tiene datos
        if (eventoDoc && eventoDoc.exists) {
          const eventoData = eventoDoc.data() as Evento; // Asegúrate de que Evento esté definido
          console.log('Evento encontrado:', eventoData);

          // Combina los datos de inscripción y evento
          this.inscripciones.push({
            inscripcionId: doc.id, // Si deseas almacenar el ID de la inscripción
            eventoId: inscripcion.eventoId,
            userId: inscripcion.userId,
            timestamp: inscripcion.timestamp,
            titulo: eventoData.titulo,
            descripcion: eventoData.descripcion,
            fecha: eventoData.fecha,
            // Agrega más campos según sea necesario
          });
        } else {
          console.error('El evento no existe o no se pudo obtener:', inscripcion.eventoId);
        }
      }
    } else {
      console.log('No se encontraron inscripciones para el usuario.');
    }

    this.isLoading = false;
  }





  async cancelarInscripcion(eventoId: string) {
    const emailEstudiante = await this.authService.getCurrentUserEmail().toPromise();
    let userId: string | null = null;
    let isInvitado = false;

    if (emailEstudiante) {
      const estudiante = await this.authService.getEstudianteByEmails(emailEstudiante).toPromise();
      userId = estudiante?.id_estudiante ?? null;
      isInvitado = false; // Es estudiante
    } else {
      const emailInvitado = await this.invitadoService.getCurrentUserEmail().toPromise();
      if (emailInvitado) {
        const invitado = await this.invitadoService.obtenerInvitadoPorEmail(emailInvitado).toPromise();
        userId = invitado?.id_Invitado ?? null;
        isInvitado = true; // Es invitado
      }
    }

    if (!userId) {
      console.error('No hay un usuario autenticado.');
      return;
    }

    try {
      // Llama al método correcto según el tipo de usuario
      if (isInvitado) {
        await this.eventosService.cancelarInscripcionInvitado(eventoId, userId);
      } else {
        await this.eventosService.cancelarInscripcionEstudiante(eventoId, userId);
      }

      await this.loadInscripciones(); // Recarga inscripciones después de cancelar
      const toast = await this.toastController.create({
        message: 'Inscripción cancelada.',
        duration: 2000,
      });
      toast.present();
    } catch (error: any) {
      console.error('Error al cancelar la inscripción:', error);
      const toast = await this.toastController.create({
        message: error.message || 'Error al cancelar la inscripción.',
        duration: 2000,
      });
      toast.present();
    }
  }


  verDetalles(eventoId: string) {
    // Navega a la página de detalles del evento
    this.router.navigate(['/eventos-detalle', eventoId]); // Asegúrate de tener la ruta correcta
  }
}

