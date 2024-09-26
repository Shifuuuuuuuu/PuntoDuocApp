import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';


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
      .then(() => {
        this.router.navigate(['/home']);
      })
      .catch((error) => {
        this.errorMessage = this.getErrorMessage(error.code);
        console.error('Error de inicio de sesión:', error); // Log del error
      });
  }


  // Método para obtener mensajes de error personalizados
  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado. Verifica tu correo o regístrate.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/invalid-email':
        return 'Correo electrónico no válido.';
      default:
        return 'Ocurrió un error inesperado. Intenta de nuevo.';
    }
  }

  ngOnInit() {
  }

}
