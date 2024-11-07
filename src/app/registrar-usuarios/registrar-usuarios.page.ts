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
    tokenFCM: ''
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

        // Registrar al estudiante en Firebase Auth
        const estudianteRegistrado = await this.estudianteService.registrarEstudiante(this.estudiante);

        if (!estudianteRegistrado.id_estudiante) {
            throw new Error('ID del estudiante no encontrado después del registro.');
        }

        // Solicitar y obtener el token FCM usando el id_estudiante recién registrado
        try {
            const tokenFCM = await this.estudianteService.solicitarPermisosYObtenerToken(estudianteRegistrado.id_estudiante);
            this.estudiante.tokenFCM = tokenFCM || null;
            console.log('Token FCM obtenido:', tokenFCM);
        } catch (error) {
            console.error('No se pudo obtener el token FCM:', error);
        }

        // Generar el código QR basado en los datos del estudiante registrado
        const qrData = JSON.stringify({
            id_estudiante: estudianteRegistrado.id_estudiante,
            email: estudianteRegistrado.email,
            Nombre_completo: estudianteRegistrado.Nombre_completo,
            Rut: estudianteRegistrado.Rut
        });
        this.estudiante.codigoQr = await QRCode.toDataURL(qrData);

        // Actualizar el estudiante en Firestore con el código QR y el token FCM
        await this.estudianteService.updateEstudiante({
            ...estudianteRegistrado,
            codigoQr: this.estudiante.codigoQr,
            tokenFCM: this.estudiante.tokenFCM  // Agregar el token FCM al estudiante
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
    if (rut.length >= 10 && rut.indexOf('-') === -1) {
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
    // Asegurar que el teléfono comience siempre con '569'
    let telefono = event.target.value;

    // Si el usuario intenta borrar el prefijo, lo restauramos
    if (!telefono.startsWith('569')) {
      telefono = '569' + telefono.replace(/[^0-9]/g, ''); // Solo permite números y fuerza el prefijo
    } else {
      // Permitir solo números después del prefijo y limitar a 8 dígitos adicionales
      telefono = telefono.replace(/[^0-9]/g, ''); // Solo permite números
      if (telefono.length > 11) {
        telefono = telefono.slice(0, 11); // Limitar a un máximo de 11 caracteres (prefijo + 8 números)
      }
    }

    // Actualizar el valor del teléfono en el modelo
    this.estudiante.Telefono = telefono;
  }



  ngOnInit() {
    const estudianteId = localStorage.getItem('id'); // O la forma en que obtengas el ID del estudiante
    if (estudianteId) {
        this.estudianteService.solicitarPermisosYObtenerToken(estudianteId).then(token => {
            if (token) {
                console.log('Token FCM en ngOnInit:', token);
            }
        }).catch(error => {
            console.error('Error al obtener el token FCM en ngOnInit:', error);
        });
    }
}

}
