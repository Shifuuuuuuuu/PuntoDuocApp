import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import * as QRCode from 'qrcode';
import { auth } from 'src/firebase';
import * as firebase from 'firebase/compat';
 // Ruta hacia tu archivo firebase.ts
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
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
    Telefono: '',
    carrera: '',
    codigoQr: '',
    puntaje: 0,
  };

  errorMessage: string = '';

  constructor(
    private estudianteService: EstudianteService,
    private router: Router,
  ) { }

  async registrar() {
    this.errorMessage = '';

    // Validar que el correo pertenezca a duocuc.cl
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(duocuc)\.cl$/;
    if (!emailPattern.test(this.estudiante.email)) {
      this.errorMessage = 'El correo electrónico debe ser de la institución (@duocuc.cl).';
      return;
    }

    try {
      // Usamos el servicio para registrar el estudiante en Firebase Authentication y Firestore
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

      console.log('Estudiante registrado correctamente. Verifique su correo electrónico.');
      this.router.navigate(['/iniciar-sesion']);

    } catch (error: any) {
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
