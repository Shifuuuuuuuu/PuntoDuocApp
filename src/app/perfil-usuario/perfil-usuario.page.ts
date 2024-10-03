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
  userEmail!: string | undefined;
  errorMessage: string | undefined;
  isQrExpanded: boolean = false;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Obtener el correo electrónico del usuario autenticado desde AuthService
    this.userEmail = this.authService.currentUserEmail;

    if (!this.userEmail) {
      // Intentar obtener el correo del invitado desde InvitadoService
      this.userEmail = this.invitadoService.currentUserEmail;
    }

    if (!this.userEmail) {
      this.errorMessage = 'Error: currentUserEmail no está definido. Asegúrate de que el usuario haya iniciado sesión correctamente.';
      console.error(this.errorMessage);
      this.router.navigate(['/iniciar-sesion']);
    } else {
      this.loadUserData();
    }
  }

  async loadUserData() {
    if (!this.userEmail) {
      console.error('Error: userEmail no está definido.');
      return;
    }

    try {
      const estudianteResult = await this.authService.getEstudianteByEmail(this.userEmail);
      if (estudianteResult) {
        this.estudiante = estudianteResult;
      } else {
        this.invitado = await this.invitadoService.obtenerInvitadoPorEmail(this.userEmail);

        if (!this.invitado) {
          console.error('No se encontró ningún invitado con ese email.');
          this.router.navigate(['/folder/Inicio']);
        }
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.router.navigate(['/folder/Inicio']);
    }
}

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/iniciar-sesion']);
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
        this.isEditing = false;
      } catch (error) {
        console.error('Error al actualizar el perfil del estudiante:', error);
      }
    } else if (this.invitado) {
      try {
        await this.invitadoService.updateInvitado(this.invitado);
        this.isEditing = false;
      } catch (error) {
        console.error('Error al actualizar el perfil del invitado:', error);
      }
    }
  }
}
