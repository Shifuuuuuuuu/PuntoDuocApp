import { Component, OnInit } from '@angular/core';
import { GestorEventosService } from '../services/gestoreventos.service';
import { GestorEventos } from '../interface/IGestorEventos';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
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

  loadGestorInfo() {
    this.gestorEventosService.getCurrentUserEmail().subscribe((email) => {
      if (email) {
        this.gestorEventosService
          .getGestorByEmail(email)
          .then((gestor: GestorEventos | null) => {
            if (gestor) {
              this.gestor = gestor;
              this.tempNombreCompleto = gestor.Nombre_completo;
              this.tempEmail = gestor.email;
              this.tempRut = gestor.rut;
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

  editProfile() {
    this.isEditing = true;
    this.tempNombreCompleto = this.gestor?.Nombre_completo || '';
    this.tempEmail = this.gestor?.email || '';
    this.tempRut = this.gestor?.rut || '';
  }

  saveProfile() {
    if (this.gestor) {
      this.gestor.Nombre_completo = this.tempNombreCompleto;
      this.gestor.rut = this.tempRut;

      this.gestorEventosService.updateGestor(this.gestor).then(() => {
        this.isEditing = false;
        Swal.fire({
          title: 'Perfil Actualizado',
          text: 'Los cambios en tu perfil se han guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }).catch(() => {
        this.errorMessage = 'Error al guardar los cambios.';
      });
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.loadGestorInfo();
  }

  confirmLogout() {
    if (!this.isEditing) {
      this.logout();
    } else {
      this.errorMessage = 'Por favor, guarda los cambios antes de cerrar sesión.';
    }
  }

  logout() {
    this.gestorEventosService.logout();
    this.router.navigate(['/login']);
  }
}
