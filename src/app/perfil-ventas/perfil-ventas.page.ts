import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-perfil-ventas',
  templateUrl: './perfil-ventas.page.html',
  styleUrls: ['./perfil-ventas.page.scss'],
})
export class PerfilVentasPage implements OnInit {
  usuarioVentas: any;
  profileImageUrl: string = ''; // URL de la imagen de perfil
  defaultProfileImage: string = 'assets/icon/default-profile.png';
  isEditing: boolean = false;
  errorMessage: string | null = null;

  tempNombreCompleto: string = '';
  tempRut: string = '';

  constructor(private firestore: AngularFirestore, private storage: AngularFireStorage) {}

  ngOnInit() {
    this.obtenerDatosUsuarioVentas();
  }

  async obtenerDatosUsuarioVentas() {
    try {
      const doc = await this.firestore.collection('UVentas').doc('QYaIkC72DoVqIUNOXtUM').get().toPromise();
      if (doc?.exists) {
        this.usuarioVentas = doc.data();
        this.profileImageUrl = this.usuarioVentas.imagen || this.defaultProfileImage;
        this.tempNombreCompleto = this.usuarioVentas.nombre_completo;
        this.tempRut = this.usuarioVentas.rut;
      } else {
        this.errorMessage = 'No se encontró el perfil del usuario de ventas.';
      }
    } catch (error) {
      console.error('Error al obtener el perfil del usuario de ventas:', error);
      this.errorMessage = 'Hubo un error al obtener el perfil del usuario de ventas. Por favor, inténtalo de nuevo.';
    }
  }

  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file && this.usuarioVentas) {
      try {
        const filePath = `profile_images/ventas/${this.usuarioVentas.email}_${new Date().getTime()}`;
        const fileRef = this.storage.ref(filePath);
        const task = await this.storage.upload(filePath, file);

        const imageUrl = await fileRef.getDownloadURL().toPromise();

        this.usuarioVentas.imagen = imageUrl;
        await this.firestore.collection('UVentas').doc('QYaIkC72DoVqIUNOXtUM').update({ imagen: imageUrl });

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
    this.tempNombreCompleto = this.usuarioVentas.nombre_completo;
    this.tempRut = this.usuarioVentas.rut;
  }

  async saveProfile() {
    if (this.usuarioVentas) {
      this.usuarioVentas.nombre_completo = this.tempNombreCompleto;
      this.usuarioVentas.rut = this.tempRut;

      try {
        await this.firestore.collection('UVentas').doc('QYaIkC72DoVqIUNOXtUM').update({
          nombre_completo: this.tempNombreCompleto,
          rut: this.tempRut,
        });
        this.isEditing = false;
        Swal.fire('Perfil Actualizado', 'Los cambios en tu perfil se han guardado correctamente.', 'success');
      } catch (error) {
        console.error('Error al guardar los cambios:', error);
        this.errorMessage = 'Error al guardar los cambios.';
      }
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.tempNombreCompleto = this.usuarioVentas.nombre_completo;
    this.tempRut = this.usuarioVentas.rut;
  }
}

