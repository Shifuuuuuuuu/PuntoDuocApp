import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import * as QRCode from 'qrcode';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { AngularFireAuth } from '@angular/fire/compat/auth';
@Component({
  selector: 'app-registrar-usuarios',
  templateUrl: './registrar-usuarios.page.html',
  styleUrls: ['./registrar-usuarios.page.scss'],
})
export class RegistrarUsuariosPage implements OnInit {
  estudiante: Estudiante = {
    id_estudiante: '',
    password: '',
    email: '',
    Nombre_completo: '',
    Rut: '',
    Telefono: '569', // Prefijo predeterminado
    carrera: '',
    codigoQr: '',
    puntaje: 0,
    tokenFCM: '',
    verificado: true // Establecer verificado como false inicialmente
  };

  errorMessage: string = '';

  constructor(
    private estudianteService: EstudianteService,
    private router: Router,
    private angularFireMessaging: AngularFireMessaging
  ) {}

  async registrar() {
    this.errorMessage = '';

    // Validar que el correo pertenezca a duocuc.cl
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(duocuc)\.cl$/;
    if (!emailPattern.test(this.estudiante.email)) {
      this.errorMessage = 'El correo electrónico debe ser de la institución (@duocuc.cl).';
      return;
    }

    try {
      // Verificar si el correo ya existe en la base de datos
      const existeCorreo = await this.estudianteService.verificarCorreoExistente(this.estudiante.email);
      if (existeCorreo) {
        Swal.fire('Error', 'El correo electrónico ya está registrado.', 'error');
        return;
      }

      // Registrar al estudiante en Firebase Auth y crear el documento en Firestore
      const estudianteRegistrado = await this.estudianteService.registrarEstudiante(this.estudiante);
      console.log('Estudiante registrado en Firestore:', estudianteRegistrado);

      // Solicitar y obtener el token FCM
      try {
        const tokenFCM = await this.estudianteService.solicitarPermisosYObtenerToken(estudianteRegistrado.id_estudiante || '');
        if (tokenFCM) {
          estudianteRegistrado.tokenFCM = tokenFCM;
          await this.estudianteService.updateEstudiante(estudianteRegistrado);
          console.log('Token FCM guardado en Firestore:', tokenFCM);
        } else {
          console.warn('No se obtuvo ningún token FCM.');
        }
      } catch (error) {
        console.error('Error al obtener el token FCM:', error);
      }

      // Generar el código QR basado en los datos del estudiante registrado
      const qrData = JSON.stringify({
        id_estudiante: estudianteRegistrado.id_estudiante,
        email: estudianteRegistrado.email,
        Nombre_completo: estudianteRegistrado.Nombre_completo,
        Rut: estudianteRegistrado.Rut
      });
      estudianteRegistrado.codigoQr = await QRCode.toDataURL(qrData);
      await this.estudianteService.updateEstudiante(estudianteRegistrado);
      console.log('Código QR generado y guardado en Firestore.');

      Swal.fire('Éxito', 'Estudiante registrado correctamente. Verifique su correo electrónico.', 'success');
      this.router.navigate(['/iniciar-sesion']);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Swal.fire('Error', 'El correo electrónico ya está en uso por otra cuenta.', 'error');
      } else {
        Swal.fire('Error', 'Ocurrió un error al registrar el estudiante.', 'error');
        console.error('Error al registrar estudiante:', error);
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
    this.estudiante.Rut = rut;
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
    this.estudiante.Telefono = telefono;
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
