import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GestorEventosService } from '../services/gestoreventos.service';

@Component({
  selector: 'app-tab-bar-admin',
  templateUrl: './tab-bar-admin.component.html',
  styleUrls: ['./tab-bar-admin.component.scss'],
})
export class TabBarAdminComponent  implements OnInit {
  public appPages = [
    { title: 'Inicio', url: '/folder-gestor-eventos', icon: 'home' },
    { title: 'Historial de eventos', url: '/historial-eventos', icon: 'reader' },
  ];

  constructor(private router: Router, private gestorEventosService: GestorEventosService) {}

  ngOnInit() {}

  navigateTo(url: string) {
    this.router.navigate([url]);
  }

  // Función para cerrar sesión
  logout() {
    this.gestorEventosService.logout();  // Llamamos al método logout del servicio
    this.router.navigate(['/iniciar-sesion']);  // Redirige al usuario a la página de login
  }
}
