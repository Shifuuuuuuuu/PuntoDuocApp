import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Inicio', url: '/folder/Inicio', icon: 'home' },
    { title: 'Historial de eventos', url: '/historial-eventos', icon: 'reader' },
    { title: 'Centro de ayuda', url: '/centro-ayuda', icon: 'help-buoy' },
    { title: 'Estadistica de usuario', url: '/estadistica-usuario', icon: 'bar-chart' },
    { title: 'Accesibilidad', url: '/accesibilidad', icon: 'accessibility' },
    { title: 'Ticket Recompensa', url: '/ver-recompensas', icon: 'cash' },
    { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle' },
  ];
  constructor() {}
}
