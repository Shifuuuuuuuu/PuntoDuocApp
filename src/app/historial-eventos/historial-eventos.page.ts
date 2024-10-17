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
@Component({
  selector: 'app-historial-eventos',
  templateUrl: './historial-eventos.page.html',
  styleUrls: ['./historial-eventos.page.scss'],
})
export class HistorialEventosPage implements OnInit {
  Eventos: Observable<Evento[]> = new Observable();
  eventosInscritos: Evento[] = [];
  userId: string = '';
  isInvitado: boolean = false;
  isLoading: boolean = false;

  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private eventosService: EventosService,
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.getCurrentUserEmail().subscribe(async (emailEstudiante) => {
      if (emailEstudiante) {
        const estudiante = await firstValueFrom(this.authService.getEstudianteByEmails(emailEstudiante));
        if (estudiante) {
          this.userId = estudiante.id_estudiante!;
          this.isInvitado = false;
          this.loadInscritos();
          return;
        }
      }

      this.invitadoSubscription = this.invitadoService.getCurrentUserEmail().subscribe(async (emailInvitado) => {
        if (emailInvitado) {
          const invitado = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(emailInvitado));
          if (invitado) {
            this.userId = invitado.id_Invitado!;
            this.isInvitado = true;
            this.loadInscritos();
            return;
          }
        }

        console.error('No hay un usuario autenticado');
        this.router.navigate(['/iniciar-sesion']);
      });
    });
  }
  async doRefresh(event: any) {
    try {
      await this.loadInscritos();
      const toast = await this.toastController.create({
        message: 'Historial actualizado.',
        duration: 2000,
      });
      toast.present();
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      event.target.complete();
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.invitadoSubscription) {
      this.invitadoSubscription.unsubscribe();
    }
  }

  async loadInscritos() {
    if (!this.userId) {
      console.error('El ID del usuario no está disponible.');
      return;
    }

    this.isLoading = true;

    try {
      const eventosSnapshot = await this.firestore.collection<Evento>('Eventos').get().toPromise();

      if (!eventosSnapshot) {
        console.log('No se encontraron eventos.');
        return;
      }

      const eventosIdsInscritos: string[] = [];

      for (const eventoDoc of eventosSnapshot.docs) {
        const eventoId = eventoDoc.id;
        const isRegistered = await this.eventosService.isUserRegistered(eventoId, this.userId);

        if (isRegistered) {
          eventosIdsInscritos.push(eventoId);
        }
      }

      if (eventosIdsInscritos.length > 0) {
        this.Eventos = this.firestore.collection<Evento>('Eventos', ref =>
          ref.where('id_evento', 'in', eventosIdsInscritos)
        ).valueChanges();
        this.Eventos.subscribe((data) => {
          this.eventosInscritos = data;
          console.log('Eventos inscritos obtenidos:', this.eventosInscritos);
        });
      } else {
        console.log('No hay eventos inscritos para este usuario.');
      }
    } catch (error) {
      console.error('Error al cargar eventos inscritos:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
