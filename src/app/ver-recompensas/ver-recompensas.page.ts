import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecompensaService } from '../services/recompensa-service.service';
import { Recompensa } from '../interface/IRecompensa';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ver-recompensas',
  templateUrl: './ver-recompensas.page.html',
  styleUrls: ['./ver-recompensas.page.scss'],
})
export class VerRecompensasPage implements OnInit {
  userEmail: string | undefined;
  recompensas: Recompensa[] = [];
  errorMessage: string | undefined;
  tienePermisos: boolean = false;

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getCurrentUserEmail().subscribe(email => {
      if (email) {
        this.userEmail = email;
        this.loadUserData();
      } else {
        this.errorMessage = 'Error: currentUserEmail no está definido.';
        console.error(this.errorMessage);
        this.router.navigate(['/iniciar-sesion']);
      }
    });
  }

  async loadUserData() {
    try {
      this.tienePermisos = await this.verificarUsuarioVentasOEventos(this.userEmail);

      if (this.tienePermisos) {
        // Cargar las recompensas si el usuario tiene permisos
        this.recompensas = await this.recompensaService.getRecompensas(); // Ahora este método debería devolver Promise<Recompensa[]>
      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }
    } catch (error) {
      this.errorMessage = 'Error al cargar los datos del usuario.';
      console.error(this.errorMessage, error);
    }
  }

  verificarUsuarioVentasOEventos(email: string | undefined): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(email === 'ron.sanhueza@duocuc.cl'); // Lógica de verificación de permisos
    });
  }
}
