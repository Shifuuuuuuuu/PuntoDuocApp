import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Asegúrate de importar el servicio

@Component({
  selector: 'app-tab-usuario',
  templateUrl: './tab-usuario.component.html',
  styleUrls: ['./tab-usuario.component.scss'],
})
export class TabUsuarioComponent implements OnInit {
  public isEstudiante: boolean = false;

  public appPages = [
    { title: 'Inicio', url: '/folder/Inicio', icon: 'home' },
    { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle' },
    { title: 'Historial', url: '/historial-eventos', icon: 'reader' },
    { title: 'Recompensa', url: '/ver-recompensas', icon: 'cash', isVisibleForEstudiante: true },
    { title: 'Estadisticas', url: '/estadistica-usuario', icon: 'bar-chart', isVisibleForEstudiante: true },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Determinar el tipo de usuario al inicializar el componente
    this.isEstudiante = this.authService.isEstudiante();
  }

  navigateTo(url: string) {
    this.router.navigate([url]);
  }
}
