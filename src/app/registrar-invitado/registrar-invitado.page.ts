import { Component, OnInit } from '@angular/core';
import { Invitado } from '../interface/IInvitado';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import * as QRCode from 'qrcode';
@Component({
  selector: 'app-registrar-invitado',
  templateUrl: './registrar-invitado.page.html',
  styleUrls: ['./registrar-invitado.page.scss'],
})
export class RegistrarInvitadoPage implements OnInit {
  invitado: Invitado = {
    id_Invitado: '',
    password: '',
    email: '',
    Nombre_completo: '',
    Rut: '',
    Telefono: '',
    codigoQr: '' // Asegúrate de que esto esté definido en la interfaz
  };

  errorMessage: string = '';

  constructor(private invitadoService: InvitadoService, private router: Router) {}

  async registrar() {
    this.errorMessage = ''; // Resetear el mensaje de error
    this.invitadoService.verificarInvitadoPorCorreo(this.invitado.email)
      .subscribe(async yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          // Si no está registrado, proceder a registrarlo
          try {
            // Registrar al invitado primero
            const nuevoInvitado = await this.invitadoService.registrarInvitado(this.invitado);

            // Obtener el ID generado por Firestore
            const idInvitado = nuevoInvitado.id_Invitado; // Asegúrate de que el método registrarInvitado retorne el documento completo

            // Crear un objeto con solo los campos necesarios para el código QR
            const qrData = JSON.stringify({
              id_Invitado: idInvitado, // Usa el ID generado por Firestore
              email: this.invitado.email,
              Nombre_completo: this.invitado.Nombre_completo,
              Rut: this.invitado.Rut
            });

            // Asegúrate de usar "codigoQr" con "Qr" en minúscula
            this.invitado.codigoQr = await QRCode.toDataURL(qrData);

            // Actualiza el invitado con el código QR en Firestore
            await this.invitadoService.guardarCodigoQr({
              ...this.invitado,
              id_Invitado: idInvitado, // Asegúrate de incluir el ID
              codigoQr: this.invitado.codigoQr // Guarda el QR en Firestore
            });

            console.log('Invitado registrado correctamente');
            this.router.navigate(['/folder/Inicio']);
          } catch (error) {
            console.error('Error al registrar invitado:', error);
            this.errorMessage = 'Ocurrió un error al registrar el invitado.';
          }
        }
      });
  }

  ngOnInit() {}
}


