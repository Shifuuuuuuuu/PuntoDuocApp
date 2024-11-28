import { Component, OnInit } from '@angular/core';
import { Invitado } from '../interface/IInvitado';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import * as QRCode from 'qrcode';
import Swal from 'sweetalert2';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { firstValueFrom } from 'rxjs';
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
    Telefono: '569', // Prefijo predeterminado
    codigoQr: '',
    tokenFCM: '',
    verificado: false, // Establecer verificado como false inicialmente
  };

  errorMessage: string = '';

  constructor(
    private invitadoService: InvitadoService,
    private router: Router,
    private angularFireMessaging: AngularFireMessaging
  ) {}

  async registrar() {
    this.errorMessage = '';

    // Validar el dominio del correo electrónico
    const emailPattern = /^(.*@gmail\.com|.*@outlook\.com|.*@yahoo\.com)$/i;
    if (!emailPattern.test(this.invitado.email)) {
      this.errorMessage = 'El correo electrónico debe ser de Gmail, Outlook o Yahoo!';
      return;
    }

    try {
      // Verificar si el correo ya está registrado en Firestore
      const yaRegistrado = await this.invitadoService.verificarInvitadoPorCorreo(this.invitado.email);
      if (yaRegistrado) {
        Swal.fire('Error', 'El correo electrónico ya está registrado.', 'error');
        return;
      }

      // Desestructurar `this.invitado` para omitir `password`
      const { password, ...invitadoData } = this.invitado;

      // Registrar al invitado en Firebase Auth y crear el documento en Firestore
      const invitadoRegistrado = await this.invitadoService.registrarInvitado(invitadoData, password);
      console.log('Invitado registrado en Firestore:', invitadoRegistrado);

      // Generar el código QR basado en los datos del invitado registrado
      const qrData = JSON.stringify({
        idInvitado: invitadoRegistrado.id_Invitado,
        nombreCompleto: invitadoRegistrado.Nombre_completo,
        rut: invitadoRegistrado.Rut,
        telefono: invitadoRegistrado.Telefono,
        eventosInscritos: invitadoRegistrado.eventosInscritos || [],
      });
      invitadoRegistrado.codigoQr = await QRCode.toDataURL(qrData);

      // Actualizar el invitado en Firestore con el QR generado
      await this.invitadoService.updateInvitado(invitadoRegistrado);
      console.log('Código QR generado y guardado en Firestore.');

      // Solicitar y obtener el token FCM
      try {
        const tokenFCM = await this.invitadoService.solicitarPermisosYObtenerToken(invitadoRegistrado.id_Invitado || '');
        if (tokenFCM) {
          invitadoRegistrado.tokenFCM = tokenFCM;
          await this.invitadoService.updateInvitado(invitadoRegistrado);
          console.log('Token FCM guardado en Firestore:', tokenFCM);
        } else {
          console.warn('No se obtuvo ningún token FCM.');
        }
      } catch (error) {
        console.error('Error al obtener el token FCM:', error);
      }

      Swal.fire('Éxito', 'Invitado registrado correctamente. Verifique su correo electrónico.', 'success');
      this.router.navigate(['/iniciar-sesion']);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Swal.fire('Error', 'El correo electrónico ya está en uso por otra cuenta.', 'error');
      } else {
        Swal.fire('Error', 'Ocurrió un error al registrar el invitado.', 'error');
        console.error('Error al registrar invitado:', error);
      }
    }
  }

  validarRUT(event: any) {
    let rut = event.target.value;
    rut = rut.replace(/[^0-9-]/g, '').replace(/k|K/g, '0');
    if (rut.length >= 10 && rut.indexOf('-') === -1) {
      rut = `${rut.slice(0, -1)}-${rut.slice(-1)}`;
    }
    if (rut.length > 10) {
      rut = rut.slice(0, 10);
    }
    if (rut.indexOf('-') !== -1 && rut.split('-')[1].length > 1) {
      rut = `${rut.split('-')[0]}-${rut.split('-')[1].slice(0, 1)}`;
    }
    this.invitado.Rut = rut;
  }

  validarTelefono(event: any) {
    let telefono = event.target.value;
    if (!telefono.startsWith('569')) {
      telefono = '569' + telefono.replace(/[^0-9]/g, '');
    } else {
      telefono = telefono.replace(/[^0-9]/g, '');
      if (telefono.length > 11) {
        telefono = telefono.slice(0, 11);
      }
    }
    this.invitado.Telefono = telefono;
  }

  ngOnInit() {
    firstValueFrom(this.angularFireMessaging.requestToken)
      .then((token) => {
        if (token) {
          console.log('Token obtenido manualmente:', token);
        } else {
          console.warn('No se pudo obtener el token');
        }
      })
      .catch((error) => {
        console.error('Error al obtener el token manualmente:', error);
      });
  }
}
