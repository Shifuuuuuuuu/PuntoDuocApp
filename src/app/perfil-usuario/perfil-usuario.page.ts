import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado'; 
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  estudiante: Estudiante | null = null;
  invitado: Invitado | null = null;
  isEditing: boolean = false;
  userEmail!: string;
  errorMessage: string | undefined;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.userEmail = this.authService.currentUserEmail; // Obtén el email del usuario
    if (!this.userEmail) {
      this.errorMessage = 'Error: currentUserEmail no está definido. Asegúrate de que el usuario haya iniciado sesión correctamente.'; // Mensaje de error
      console.error(this.errorMessage);
      this.router.navigate(['/login']); // Redirigir si no hay usuario autenticado
    } else {
      this.loadUserData();
    }
  }


  async loadUserData() {
    try {
      // Intentar obtener datos del estudiante primero
      const estudianteResult = await this.authService.getEstudianteByEmail(this.userEmail);
      if (estudianteResult) {
        this.estudiante = estudianteResult;
      } else {
        // Si no es estudiante, intentar obtener datos del invitado
        this.invitado = await this.invitadoService.obtenerInvitadoPorEmail(this.userEmail);
        if (!this.invitado) {
          console.error('No se encontró ningún invitado con ese email.');
          this.router.navigate(['/login']); // Redirigir si no hay invitado
        }
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.router.navigate(['/login']); // Redirigir en caso de error
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/iniciar-sesion']); // Redirige a la página de inicio de sesión
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  editProfile() {
    this.isEditing = true;
  }

  async saveProfile() {
    if (this.estudiante) {
      try {
        await this.authService.updateEstudiante(this.estudiante);
        this.isEditing = false; // Dejar de editar después de guardar
      } catch (error) {
        console.error('Error al actualizar el perfil del estudiante:', error);
      }
    } else if (this.invitado) {
      try {
        await this.invitadoService.updateInvitado(this.invitado); // Actualiza el perfil del invitado
        this.isEditing = false; // Dejar de editar después de guardar
      } catch (error) {
        console.error('Error al actualizar el perfil del invitado:', error);
      }
    }
  }
}
