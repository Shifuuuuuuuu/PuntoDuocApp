import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-perfil-ventas',
  templateUrl: './perfil-ventas.page.html',
  styleUrls: ['./perfil-ventas.page.scss'],
})
export class PerfilVentasPage implements OnInit {
  usuarioVentas: any;
  isEditing: boolean = false;
  errorMessage: string | null = null;

  tempNombreCompleto: string = '';
  tempRut: string = '';

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.obtenerDatosUsuarioVentas();
  }

  async obtenerDatosUsuarioVentas() {
    try {
      const doc = await this.firestore.collection('UVentas').doc('QYaIkC72DoVqIUNOXtUM').get().toPromise();
      if (doc?.exists) {
        this.usuarioVentas = doc.data();
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
          rut: this.tempRut
        });
        this.isEditing = false;
        Swal.fire({
          title: 'Perfil Actualizado',
          text: 'Los cambios en tu perfil se han guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
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

