import { Component, OnInit } from '@angular/core';
import { GestorEventosService } from '../services/gestoreventos.service';
import { GestorEventos } from '../interface/IGestorEventos';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AngularFireStorage } from '@angular/fire/compat/storage';
@Component({
  selector: 'app-perfil-gestor',
  templateUrl: './perfil-gestor.page.html',
  styleUrls: ['./perfil-gestor.page.scss'],
})
export class PerfilGestorPage implements OnInit {
  gestor: GestorEventos | null = null;
  profileImageUrl: string = ''; // Imagen de perfil
  defaultProfileImage: string = 'assets/icon/default-profile.png';
  isEditing: boolean = false;
  errorMessage: string | null = null;

  tempNombreCompleto: string = '';
  tempEmail: string = '';
  tempRut: string = '';

  constructor(
    private gestorEventosService: GestorEventosService,
    private router: Router,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.loadGestorInfo();
  }

  loadGestorInfo() {
    this.gestorEventosService.getCurrentUserEmail().subscribe((email) => {
      if (email) {
        this.gestorEventosService.getGestorByEmail(email).then((gestor) => {
          if (gestor) {
            this.gestor = gestor;
            this.profileImageUrl = gestor.imagen || this.defaultProfileImage;
            this.tempNombreCompleto = gestor.Nombre_completo;
            this.tempRut = gestor.rut;
          } else {
            this.errorMessage = 'Gestor no encontrado.';
          }
        });
      } else {
        this.errorMessage = 'No se ha encontrado un gestor autenticado.';
      }
    });
  }
  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file && this.gestor) {
      try {
        const filePath = `profile_images/gestores/${this.gestor.email}_${new Date().getTime()}`;
        const fileRef = this.storage.ref(filePath);
        const task = await this.storage.upload(filePath, file);

        const imageUrl = await fileRef.getDownloadURL().toPromise();

        // Actualiza la URL en Firestore
        this.gestor.imagen = imageUrl;
        await this.gestorEventosService.updateGestor(this.gestor);

        this.profileImageUrl = imageUrl;

        Swal.fire('Éxito', 'Imagen de perfil actualizada correctamente.', 'success');
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        Swal.fire('Error', 'Hubo un problema al subir la imagen.', 'error');
      }
    }
  }

  editProfile() {
    this.isEditing = true;
    this.tempNombreCompleto = this.gestor?.Nombre_completo || '';
    this.tempEmail = this.gestor?.email || '';
    this.tempRut = this.gestor?.rut || '';
  }
  async saveProfile() {
    if (this.gestor) {
      this.gestor.Nombre_completo = this.tempNombreCompleto;
      this.gestor.rut = this.tempRut;

      try {
        await this.gestorEventosService.updateGestor(this.gestor);
        this.isEditing = false;
        Swal.fire('Éxito', 'Perfil actualizado correctamente.', 'success');
      } catch (error) {
        console.error('Error al guardar perfil:', error);
        Swal.fire('Error', 'Hubo un problema al guardar los cambios.', 'error');
      }
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.tempNombreCompleto = this.gestor?.Nombre_completo || ''; // Valor predeterminado si gestor es null
    this.tempRut = this.gestor?.rut || ''; // Valor predeterminado si gestor es null
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
