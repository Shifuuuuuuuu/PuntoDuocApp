import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Evento } from '../interface/IEventos';
import { EventosService } from '../services/eventos.service';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  Eventos: Observable<Evento[]> = new Observable();
  filteredEvents: Evento[] = [];
  searchText: string = '';
  showFilters: boolean = false;
  folder: string = '';
  userId: string = ''; // ID del usuario autenticado
  isInvitado: boolean = false; // Indicador para saber si el usuario es un invitado

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private eventosService: EventosService,
    private authService: AuthService, // Servicio de autenticación
    private invitadoService: InvitadoService // Servicio de invitados
  ) {
    this.loadEvents();
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

    // Obtener el email del usuario autenticado
    const email = this.authService.getCurrentUserEmail();

    // Verificar que el email no sea null o undefined
    if (email) {
      // Primero, verificar si el usuario es un estudiante registrado
      this.authService.getEstudianteByEmail(email).then(user => {
        if (user) {
          this.userId = user.id_estudiante!;
          this.isInvitado = false; // Si es un estudiante, no es un invitado
        } else {
          // Si no es estudiante, verificar si es un invitado registrado
          this.invitadoService.obtenerInvitadoPorEmail(email).then(invitado => {
            if (invitado) {
              this.userId = invitado.id_Invitado!;
              this.isInvitado = true; // Si se encuentra en la colección de invitados, es un invitado
            }
          }).catch(error => {
            console.error('Error al obtener invitado por email:', error);
          });
        }
      }).catch(error => {
        console.error('Error al obtener estudiante por email:', error);
      });
    } else {
      console.error('No hay un usuario autenticado'); // Manejo de error si no hay usuario autenticado
    }
  }

  loadEvents() {
    this.Eventos = this.firestore.collection<Evento>('Eventos').valueChanges();
    this.Eventos.subscribe(data => {
      this.filteredEvents = data;
      this.filteredEvents.forEach(event => {
        event.show = false;

        // Verificar si el usuario está inscrito en el evento, considerando el rol (estudiante o invitado)
        this.eventosService.isUserRegistered(event.id_evento, this.userId).then(isRegistered => {
          event.estaInscrito = isRegistered;
        });
      });
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  filterEvents() {
    this.Eventos.subscribe(data => {
      this.filteredEvents = data.filter(evento =>
        evento.titulo.toLowerCase().includes(this.searchText.toLowerCase())
      );
    });
  }

  async presentAlert(event: Evento) {
    const alert = await this.alertController.create({
      header: '¿Quieres inscribirte al evento?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Sí',
          handler: () => {
            this.inscribirUsuario(event.id_evento); // Llama al método para inscribir al usuario
          }
        }
      ]
    });

    await alert.present();
  }

  async inscribirUsuario(eventoId: string) {
    try {
      await this.eventosService.inscribirUsuario(eventoId, this.userId);
      this.router.navigate(['/perfil-usuario']); // Redirige a la página de perfil del usuario
    } catch (error) {
      console.error((error as Error).message); // Manejo de errores
      const alert = await this.alertController.create({
        header: 'Error',
        message: (error as Error).message,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async cancelarInscripcion(eventoId: string) {
    try {
      await this.eventosService.cancelarInscripcion(eventoId, this.userId);
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Inscripción cancelada correctamente.',
        buttons: ['OK']
      });
      await alert.present();
      this.loadEvents(); // Recarga los eventos después de cancelar
    } catch (error) {
      console.error((error as Error).message);
      const alert = await this.alertController.create({
        header: 'Error',
        message: (error as Error).message,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  toggleDescription(event: Evento) {
    event.show = !event.show; // Alterna el estado de visibilidad de la descripción
  }
}



