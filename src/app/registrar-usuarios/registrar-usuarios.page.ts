import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import * as QRCode from 'qrcode';
import { auth } from 'src/firebase';
import * as firebase from 'firebase/compat';
 // Ruta hacia tu archivo firebase.ts
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
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
    Telefono: '',
    carrera: '',
    codigoQr: '',
    puntaje: 0,
  };

  errorMessage: string = '';

  constructor(private estudianteService: EstudianteService, private router: Router) { }

  async registrar() {
    this.errorMessage = '';

    // Validar que el correo pertenezca a Gmail, Outlook o Yahoo
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(duocuc)\.cl$/;
    if (!emailPattern.test(this.estudiante.email)) {
      this.errorMessage = 'El correo electrónico debe ser de Gmail, Outlook o Yahoo.';
      return;
    }

    // Verificar si el correo ya está registrado en Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, // Se pasa el objeto auth aquí
        this.estudiante.email,
        this.estudiante.password
      );

      // Enviar correo de verificación
      const user = userCredential.user;
      if (user) {
        await sendEmailVerification(user);

        // Registrar el estudiante en Firestore sin contraseña
        const nuevoEstudiante = await this.estudianteService.registrarEstudiante(this.estudiante);

        // Generar el código QR
        const qrData = JSON.stringify({
          id_estudiante: nuevoEstudiante.id_estudiante,
          email: this.estudiante.email,
          Nombre_completo: this.estudiante.Nombre_completo,
          Rut: this.estudiante.Rut
        });
        this.estudiante.codigoQr = await QRCode.toDataURL(qrData);

        // Actualizar el estudiante en Firestore
        await this.estudianteService.updateEstudiante({
          ...nuevoEstudiante,
          codigoQr: this.estudiante.codigoQr
        } as Omit<Estudiante, 'password'>);

        console.log('Estudiante registrado correctamente. Verifique su correo electrónico.');
        this.router.navigate(['/iniciar-sesion']);
      }
    } catch (error: any) {  // Cambiamos 'unknown' a 'any' para manejar los errores correctamente
      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage = 'El correo electrónico ya está registrado.';
      } else {
        console.error('Error al registrar estudiante:', error);
        this.errorMessage = 'Ocurrió un error al registrar el estudiante.';
      }
    }
  }


  ngOnInit() { }
}
