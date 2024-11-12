import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-perfil-ventas',
  templateUrl: './perfil-ventas.page.html',
  styleUrls: ['./perfil-ventas.page.scss'],
})
export class PerfilVentasPage implements OnInit {
  usuarioVentas: any;
  errorMessage: string;

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.obtenerDatosUsuarioVentas();
  }

  async obtenerDatosUsuarioVentas() {
    try {
      const doc = await this.firestore.collection('UVentas').doc('QYaIkC72DoVqIUNOXtUM').get().toPromise();
      if (doc?.exists) {  // doc?.exists will safely check if 'doc' is not undefined
        this.usuarioVentas = doc.data();
      } else {
        this.errorMessage = 'No se encontró el perfil del usuario de ventas.';
      }
    } catch (error) {
      console.error('Error al obtener el perfil del usuario de ventas:', error);
      this.errorMessage = 'Hubo un error al obtener el perfil del usuario de ventas. Por favor, inténtalo de nuevo.';
    }
  }
}

