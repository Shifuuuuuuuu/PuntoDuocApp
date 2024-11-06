import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import * as QRCode from 'qrcode';
import Swal from 'sweetalert2';
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
  };

  errorMessage: string = '';

  constructor(
    private estudianteService: EstudianteService,
    private router: Router,
  ) {}


  async registrar() {
    this.errorMessage = '';

    // Validar que el correo pertenezca a duocuc.cl
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(duocuc)\.cl$/;
    if (!emailPattern.test(this.estudiante.email)) {
      Swal.fire('Error', 'El correo electrónico debe ser de la institución (@duocuc.cl).', 'error');
      return;
    }

    try {
      // Verificar si el correo ya existe en la base de datos
      const existeCorreo = await this.estudianteService.verificarCorreoExistente(this.estudiante.email);
      if (existeCorreo) {
        Swal.fire('Error', 'El correo electrónico ya está registrado.', 'error');
        return;
      }

      // Registrar al estudiante en Firebase Auth
      const estudianteRegistrado = await this.estudianteService.registrarEstudiante(this.estudiante);

      // Generar el código QR basado en los datos del estudiante registrado
      const qrData = JSON.stringify({
        id_estudiante: estudianteRegistrado.id_estudiante,
        email: estudianteRegistrado.email,
        Nombre_completo: estudianteRegistrado.Nombre_completo,
        Rut: estudianteRegistrado.Rut
      });
      this.estudiante.codigoQr = await QRCode.toDataURL(qrData);

      // Actualizar el estudiante en Firestore con el código QR
      await this.estudianteService.updateEstudiante({
        ...estudianteRegistrado,
        codigoQr: this.estudiante.codigoQr
      });

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

    // Remover cualquier carácter que no sea número o guion, y reemplazar 'k' o 'K' por '0'
    rut = rut.replace(/[^0-9-]/g, '').replace(/k|K/g, '0');

    // Formatear el RUT: agregar guion antes del último dígito si no está presente
    if (rut.length >= 9 && rut.indexOf('-') === -1) {
      rut = `${rut.slice(0, -1)}-${rut.slice(-1)}`;
    }

    // Limitar la longitud total a 10 caracteres
    if (rut.length > 10) {
      rut = rut.slice(0, 10);
    }

    // Evitar que se borre el guion y mantener la estructura del RUT
    if (rut.indexOf('-') !== -1 && rut.split('-')[1].length > 1) {
      rut = `${rut.split('-')[0]}-${rut.split('-')[1].slice(0, 1)}`;
    }

    // Actualizar el valor en el modelo
    this.estudiante.Rut = rut;
  }




  validarTelefono(event: any) {
    let telefono = event.target.value;

    // Asegurar que solo contenga números y que comience con '569'
    telefono = telefono.replace(/[^0-9]/g, ''); // Solo permite números
    if (!telefono.startsWith('569')) {
      telefono = '569'; // Mantener prefijo '569' al inicio
    }

    // Limitar a 11 caracteres (prefijo '569' + 8 números)
    if (telefono.length > 11) {
      telefono = telefono.slice(0, 11);
    }

    // Actualizar el valor en el modelo
    this.estudiante.Telefono = telefono;
  }


  ngOnInit() { }
}
