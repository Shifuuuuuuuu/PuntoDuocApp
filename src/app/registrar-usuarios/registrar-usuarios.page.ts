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
    puntaje: 0, // Inicializa el puntaje en 0
  };

  errorMessage: string = '';

  constructor(private estudianteService: EstudianteService, private router: Router) { }

  async registrar() {
    this.errorMessage = '';  // Resetear el mensaje de error
    this.estudianteService.verificarEstudiantePorCorreo(this.estudiante.email)
      .subscribe(async yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          // Si no está registrado, proceder a registrarlo
          try {
            // Registrar al estudiante primero
            const nuevoEstudiante = await this.estudianteService.registrarEstudiante(this.estudiante);

            // Obtener el ID generado por Firestore
            const idEstudiante = nuevoEstudiante.id_estudiante; // Asegúrate de que el método registrarEstudiante retorne el documento completo

            // Crear un objeto con solo los campos necesarios para el código QR
            const qrData = JSON.stringify({
              id_estudiante: idEstudiante, // Usa el ID generado por Firestore
              email: this.estudiante.email,
              Nombre_completo: this.estudiante.Nombre_completo,
              Rut: this.estudiante.Rut
            });

            // Asegúrate de usar "codigoQr" con "Qr" en minúscula
            this.estudiante.codigoQr = await QRCode.toDataURL(qrData);

            // Actualiza el estudiante con el código QR y el puntaje en Firestore
            await this.estudianteService.updateEstudiante({
              ...this.estudiante,
              id_estudiante: idEstudiante, // Asegúrate de incluir el ID
              codigoQr: this.estudiante.codigoQr
            });

            console.log('Estudiante registrado correctamente');
            this.router.navigate(['/iniciar-sesion']);
          } catch (error) {
            console.error('Error al registrar estudiante:', error);
            this.errorMessage = 'Ocurrió un error al registrar el estudiante.';
          }
        }
      });
  }

  ngOnInit() {
  }

}
