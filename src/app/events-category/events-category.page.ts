import { Component, OnInit } from '@angular/core';
import { Evento } from '../interface/IEventos';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-events-category',
  templateUrl: './events-category.page.html',
  styleUrls: ['./events-category.page.scss'],
})
export class EventsCategoryPage implements OnInit {
  category: string = '';
  events: Evento[] = [];
  unreadNotificationsCount: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.category = this.route.snapshot.paramMap.get('category') || '';
    this.loadEventsByCategory();

    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

  loadEventsByCategory() {
    this.firestore.collection<Evento>('Eventos', ref =>
      ref.where('categoria', '==', this.category)
    ).get().subscribe((snapshot) => {
      this.events = snapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() } as Evento; // Incluye el ID del documento como `id`
      });
    });
  }

  goToEventDetails(event: Evento) {
    if (event.id) {
      this.router.navigate(['/event-details', event.id]); // Usa el `id` del documento
    } else {
      console.error('El evento no tiene un ID válido.');
    }
  }
}
