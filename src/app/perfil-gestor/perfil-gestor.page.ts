import { Component, OnInit } from '@angular/core';
import { GestorEventosService } from '../services/gestoreventos.service';
import { GestorEventos } from '../interface/IGestorEventos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-gestor',
  templateUrl: './perfil-gestor.page.html',
  styleUrls: ['./perfil-gestor.page.scss'],
})
export class PerfilGestorPage implements OnInit {
  gestor: GestorEventos | null = null;
  isEditing: boolean = false;
  errorMessage: string | null = null;

  tempNombreCompleto: string = '';
  tempEmail: string = '';
  tempRut: string = '';

  constructor(
    private gestorEventosService: GestorEventosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGestorInfo();
  }

  // Cargar la información del gestor desde el servicio
  loadGestorInfo() {
    this.gestorEventosService.getCurrentUserEmail().subscribe((email) => {
      if (email) {
        console.log('Cargando gestor con email:', email); // Verificación
        this.gestorEventosService
          .getGestorByEmail(email)
          .then((gestor: GestorEventos | null) => {
            if (gestor) {
              this.gestor = gestor;
              this.tempNombreCompleto = gestor.Nombre_completo;
              this.tempEmail = gestor.email;
              this.tempRut = gestor.rut;
              console.log('Datos del gestor cargados:', this.gestor); // Verifica los datos cargados
            } else {
              this.errorMessage = 'Gestor no encontrado.';
            }
          })
          .catch(() => {
            this.errorMessage = 'Error al cargar la información del gestor.';
          });
      } else {
        this.errorMessage = 'No se ha encontrado un gestor autenticado.';
      }
    });
  }

  // Activar el modo de edición
  editProfile() {
    this.isEditing = true;
  }

  // Guardar los cambios en el perfil
  saveProfile() {
    if (this.gestor) {
      this.gestor.Nombre_completo = this.tempNombreCompleto;
      this.gestor.email = this.tempEmail;
      this.gestor.rut = this.tempRut;

      console.log('Guardando cambios del gestor:', this.gestor); // Verificación
      this.gestorEventosService.updateGestor(this.gestor).then(() => {
        this.isEditing = false;
        console.log('Perfil actualizado exitosamente'); // Verificación de éxito
      }).catch(() => {
        this.errorMessage = 'Error al guardar los cambios.';
      });
    }
  }

  // Cancelar la edición del perfil
  cancelEdit() {
    this.isEditing = false;
    this.loadGestorInfo();
  }

  // Confirmar cierre de sesión
  confirmLogout() {
    this.gestorEventosService.logout();
    this.router.navigate(['/login']);
  }
}
