import { Component, OnInit } from '@angular/core';
import { Invitado } from '../interface/IInvitado';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import * as QRCode from 'qrcode';
import { getAuth, isSignInWithEmailLink } from 'firebase/auth';
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
    codigoQr: ''
  };

  errorMessage: string = '';

  constructor(private invitadoService: InvitadoService, private router: Router) {}

  async registrar() {
    this.errorMessage = ''; // Resetear el mensaje de error

    // Validar el dominio del correo electrónico
    const emailPattern = /^(.*@gmail\.com|.*@outlook\.com|.*@yahoo\.com)$/i;
    if (!emailPattern.test(this.invitado.email)) {
      this.errorMessage = 'El correo electrónico debe ser de Gmail, Outlook o Yahoo!';
      return; // Detener la ejecución si el correo no es válido
    }

    // Verificar si el correo ya está registrado
    this.invitadoService.verificarInvitadoPorCorreo(this.invitado.email)
      .subscribe(async yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          try {
            // Registrar al invitado en Authentication y Firestore
            const nuevoInvitado = await this.invitadoService.registrarInvitado(this.invitado);

            // Generar el código QR
            const qrData = JSON.stringify({
              id_Invitado: nuevoInvitado.id_Invitado,
              email: this.invitado.email,
              Nombre_completo: this.invitado.Nombre_completo,
              Rut: this.invitado.Rut
            });

            this.invitado.codigoQr = await QRCode.toDataURL(qrData);

            // Guardar el QR en Firestore
            await this.invitadoService.guardarCodigoQr({
              ...nuevoInvitado,
              codigoQr: this.invitado.codigoQr
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


