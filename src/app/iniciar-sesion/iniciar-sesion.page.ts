import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Estudiante } from '../interface/IEstudiante';


@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.page.html',
  styleUrls: ['./iniciar-sesion.page.scss'],
})
export class IniciarSesionPage implements OnInit {

  user = {
    email: '',
    password: ''
  };
  rememberMe: boolean = false;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  iniciarSesion() {
    console.log('Correo:', this.user.email); // Log del correo
    console.log('Contraseña:', this.user.password); // Log de la contraseña

    this.authService.login(this.user.email, this.user.password)
      .then((estudiante: Estudiante | null) => {
        if (estudiante) {
          console.log('Inicio de sesión exitoso:', estudiante);
          this.router.navigate(['/folder/Inicio']);
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        }
      })
      .catch((error) => {
        this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
        console.error('Error de inicio de sesión:', error); // Log del error
      });
  }

  ngOnInit() {}


}
