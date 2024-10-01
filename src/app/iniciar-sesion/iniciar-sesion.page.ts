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
      .then((studentData) => {
        if (studentData) {
          this.router.navigate(['/folder/Inicio']);
        } else {
          this.errorMessage = 'Correo o contraseña incorrectos.'; // Mensaje de error si no se encuentra el usuario
          console.error('Inicio de sesión fallido: usuario no encontrado o contraseña incorrecta.'); // Log de error
        }
      })
      .catch((error) => {
        this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.'; // Mensaje general de error
        console.error('Error de inicio de sesión:', error); // Log del error
      });
  }
  clearField(field: keyof typeof this.user) {
    this.user[field] = '';
  }
  ngOnInit() {}


}
