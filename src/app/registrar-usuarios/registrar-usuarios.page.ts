import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import * as QRCode from 'qrcode';

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
    this.estudianteService.verificarEstudiantePorCorreo(this.estudiante.email)
      .subscribe(async yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          try {
            // Registrar el estudiante, sin la contraseña en Firestore
            const nuevoEstudiante = await this.estudianteService.registrarEstudiante(this.estudiante);

            // Generar el código QR
            const qrData = JSON.stringify({
              id_estudiante: nuevoEstudiante.id_estudiante,
              email: this.estudiante.email,
              Nombre_completo: this.estudiante.Nombre_completo,
              Rut: this.estudiante.Rut
            });

            this.estudiante.codigoQr = await QRCode.toDataURL(qrData);

            // Actualiza el estudiante sin la contraseña, usando Omit para excluir 'password'
            await this.estudianteService.updateEstudiante({
              ...nuevoEstudiante,
              codigoQr: this.estudiante.codigoQr
            } as Omit<Estudiante, 'password'>); // Omitimos la propiedad 'password'

            console.log('Estudiante registrado correctamente. Verifique su correo electrónico.');
            this.router.navigate(['/iniciar-sesion']);
          } catch (error) {
            console.error('Error al registrar estudiante:', error);
            this.errorMessage = 'Ocurrió un error al registrar el estudiante.';
          }
        }
      });
  }

  ngOnInit() { }
}
