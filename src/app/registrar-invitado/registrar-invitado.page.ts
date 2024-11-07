import { Component, OnInit } from '@angular/core';
import { Invitado } from '../interface/IInvitado';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import * as QRCode from 'qrcode';
import Swal from 'sweetalert2';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { environment } from 'src/environments/environment';
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
      verificado: false
    };

    errorMessage: string = '';

    constructor(
      private invitadoService: InvitadoService,
      private router: Router,
      private angularFireMessaging: AngularFireMessaging
    ) {}

    async registrar() {
      this.errorMessage = '';
      console.log('Iniciando el proceso de registro...');

      // Validar el dominio del correo electrónico
      const emailPattern = /^(.*@gmail\.com|.*@outlook\.com|.*@yahoo\.com)$/i;
      if (!emailPattern.test(this.invitado.email)) {
        this.errorMessage = 'El correo electrónico debe ser de Gmail, Outlook o Yahoo!';
        console.log(this.errorMessage);
        return; // Detener la ejecución si el correo no es válido
      }

      // Validar el formato de RUT
      const rutPattern = /^[0-9]{7,8}-[0-9kK]{1}$/;
      if (!rutPattern.test(this.invitado.Rut)) {
        this.errorMessage = 'El RUT debe tener un formato válido (ejemplo: 12345678-9).';
        console.log(this.errorMessage);
        return; // Detener la ejecución si el RUT no es válido
      }

      // Validar el número de teléfono
      const telefonoPattern = /^569\d{8}$/;
      if (!telefonoPattern.test(this.invitado.Telefono)) {
        this.errorMessage = 'El teléfono debe tener 11 dígitos y comenzar con 569.';
        console.log(this.errorMessage);
        return; // Detener la ejecución si el teléfono no es válido
      }

      console.log('Verificando si el correo ya está registrado...');
      try {
        const yaRegistrado = await this.invitadoService.verificarInvitadoPorCorreo(this.invitado.email);
        if (yaRegistrado) {
          Swal.fire('Error', 'El correo electrónico ya está registrado.', 'error');
          return; // Detener la ejecución si el correo ya está registrado
        }

        console.log('El correo no está registrado, procediendo con el registro...');
        // Registrar al invitado en Firebase Auth
        const nuevoInvitado = await this.invitadoService.registrarInvitado(this.invitado);

        if (!nuevoInvitado.id_Invitado) {
          throw new Error('ID del invitado no encontrado después del registro.');
        }

        // Solicitar y obtener el token FCM usando el id_Invitado recién registrado
        console.log('Intentando obtener el token FCM...');
        try {
          const tokenFCM = await this.invitadoService.solicitarPermisosYObtenerToken(nuevoInvitado.id_Invitado);
          console.log('Token FCM obtenido:', tokenFCM);

          if (tokenFCM) {
            this.invitado.tokenFCM = tokenFCM;
            // Actualizar el token FCM en Firestore
            await this.invitadoService.updateInvitado({
              id_Invitado: nuevoInvitado.id_Invitado,
              email: nuevoInvitado.email,
              Nombre_completo: nuevoInvitado.Nombre_completo,
              Rut: nuevoInvitado.Rut,
              Telefono: nuevoInvitado.Telefono,
              codigoQr: nuevoInvitado.codigoQr,
              tokenFCM: this.invitado.tokenFCM,
              verificado: nuevoInvitado.verificado
            });
            console.log('Token FCM guardado en Firestore:', this.invitado.tokenFCM);
          } else {
            console.warn('No se obtuvo ningún token FCM.');
          }
        } catch (error) {
          console.error('Error al obtener el token FCM:', error);
        }

        // Generar el código QR basado en los datos del invitado registrado
        const qrData = JSON.stringify({
          id_Invitado: nuevoInvitado.id_Invitado,
          email: nuevoInvitado.email,
          Nombre_completo: nuevoInvitado.Nombre_completo,
          Rut: nuevoInvitado.Rut
        });
        this.invitado.codigoQr = await QRCode.toDataURL(qrData);

        // Actualizar el invitado en Firestore con el código QR
        try {
          await this.invitadoService.updateInvitado({
            id_Invitado: nuevoInvitado.id_Invitado,
            email: nuevoInvitado.email,
            Nombre_completo: nuevoInvitado.Nombre_completo,
            Rut: nuevoInvitado.Rut,
            Telefono: nuevoInvitado.Telefono,
            codigoQr: this.invitado.codigoQr,
            tokenFCM: this.invitado.tokenFCM,
            verificado: nuevoInvitado.verificado
          });
          console.log('Código QR generado y guardado en Firestore.');
        } catch (qrError) {
          console.error('Error al guardar el código QR en Firestore:', qrError);
        }

        // Mostrar mensaje de éxito
        Swal.fire('Éxito', 'Invitado registrado correctamente. Verifique su correo electrónico antes de iniciar sesión.', 'success');
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

    ngOnInit() {
      firstValueFrom(this.angularFireMessaging.requestToken).then(
        (token) => {
          if (token) {
            console.log('Token obtenido manualmente:', token);
          } else {
            console.warn('No se pudo obtener el token');
          }
        }
      ).catch(
        (error) => {
          console.error('Error al obtener el token manualmente:', error);
        }
      );
    }
  }
