import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  estudiante: Estudiante | null = null;
  isEditing: boolean = false;
  userEmail!: string;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userEmail = this.authService.currentUserEmail; // Obtén el email del estudiante que ha iniciado sesión
    if (!this.userEmail) {
      console.error('Error: currentUserEmail no está definido. Asegúrate de que el usuario haya iniciado sesión correctamente.');
      this.router.navigate(['/login']); // Redirigir si no hay usuario autenticado
    } else {
      this.loadUserData();
    }
  }


  async loadUserData() {
    try {
      if (this.userEmail) { // Verifica que userEmail esté definido
        const result = await this.authService.getEstudianteByEmail(this.userEmail);
        this.estudiante = result !== undefined ? result : null;
      } else {
        console.error('Error: userEmail no está definido.');
      }
    } catch (error) {
      console.error('Error al cargar los datos del estudiante:', error);
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
        console.error('Error al actualizar el perfil:', error);
      }
    }
  }
}
