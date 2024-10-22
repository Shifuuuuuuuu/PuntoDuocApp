import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {VentasAuthService} from '../services/ventas.service'


@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  errorMessage: string | undefined;


  constructor(private router: Router, private ventasAuthService: VentasAuthService) {}

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['/ver-recompensas']);
  }

  logoutt() {
    console.log('Cerrando sesión...');
    this.ventasAuthService.logout();
    this.router.navigate(['/iniciar-sesion']); // Redirigir a la página de inicio de sesión
  }

}
