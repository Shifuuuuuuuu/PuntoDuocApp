import { Component, inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  Eventos: Observable<any[]> = new Observable(); // Inicializar como Observable vacío
  filteredEvents: any[] = [];
  searchText: string = '';
  showFilters: boolean = false;
  folder: string = ''; // Inicializar como cadena vacía

  constructor(
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.loadEvents();
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

  loadEvents() {
    this.Eventos = this.firestore.collection('Eventos').valueChanges();
    this.Eventos.subscribe(data => {
      this.filteredEvents = data;
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

  async presentAlert() {
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
            this.router.navigate(['/pagina-principal']); // Redirige a la página principal
          }
        }
      ]
    });

    await alert.present();
  }
}


