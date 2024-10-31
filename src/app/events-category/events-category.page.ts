import { Component, OnInit } from '@angular/core';
import { Evento } from '../interface/IEventos';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-events-category',
  templateUrl: './events-category.page.html',
  styleUrls: ['./events-category.page.scss'],
})
export class EventsCategoryPage implements OnInit {
  category: string = '';
  events: Evento[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.category = this.route.snapshot.paramMap.get('category') || '';
    this.loadEventsByCategory();
  }

  loadEventsByCategory() {
    this.firestore.collection<Evento>('Eventos', ref =>
      ref.where('categoria', '==', this.category)
    ).valueChanges().subscribe((events) => {
      this.events = events;
    });
  }

  goToEventDetails(event: Evento) {
    this.router.navigate(['/event-details', event.id_evento]);
  }
}
