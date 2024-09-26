import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';


@Component({
  selector: 'app-registrar-usuarios',
  templateUrl: './registrar-usuarios.page.html',
  styleUrls: ['./registrar-usuarios.page.scss'],
})
export class RegistrarUsuariosPage implements OnInit {

  estudiante: Estudiante = {
    id_estudiante: '',
    Contrasena: '',
    Correo_electronico: '',
    Nombre_completo: '',
    Rut: '',
    Telefono: ''
  };

  errorMessage: string = '';

  constructor(private estudianteService: EstudianteService, private router: Router) { }

  registrar() {
    this.errorMessage = '';  // Resetear el mensaje de error
    this.estudianteService.verificarEstudiantePorCorreo(this.estudiante.Correo_electronico)
      .subscribe(yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          // Si no está registrado, proceder a registrarlo
          this.estudianteService.registrarEstudiante(this.estudiante).then(() => {
            console.log('Estudiante registrado correctamente');
            this.router.navigate(['/iniciar-sesion']);
          }).catch(error => {
            console.error('Error al registrar estudiante:', error);
            this.errorMessage = 'Ocurrió un error al registrar el estudiante.';
          });
        }
      });
  }

  ngOnInit() {
  }

}
