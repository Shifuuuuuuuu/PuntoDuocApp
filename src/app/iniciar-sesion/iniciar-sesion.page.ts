import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';



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

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService, // Inyecta el servicio InvitadoService
    private router: Router
  ) {}

  ngOnInit() {}

  iniciarSesion() {
    console.log('Correo:', this.user.email);
    console.log('Contraseña:', this.user.password);

    // Verifica si el usuario es un invitado por su correo utilizando `subscribe`
    this.invitadoService.verificarInvitadoPorCorreo(this.user.email)
      .subscribe((esInvitado: boolean) => {
        if (esInvitado) {
          // Si es un invitado, obtener su información y redirigir
          this.invitadoService.obtenerInvitadoPorEmail(this.user.email)
            .then((invitado) => {
              if (invitado && invitado.password === this.user.password) {
                // Inicio de sesión exitoso para el invitado
                console.log('Inicio de sesión como invitado exitoso:', invitado);

                // Establecer el correo electrónico en InvitadoService
                this.invitadoService.setCurrentUserEmail(this.user.email);

                // Navegar a la página de inicio
                this.router.navigate(['/folder/Inicio']);
              } else {
                this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';
              }
            })
            .catch((error: any) => { // Especifica el tipo `error`
              this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
              console.error('Error al obtener invitado:', error);
            });
        } else {
          // Si no es un invitado, intenta iniciar sesión como estudiante
          this.authService.login(this.user.email, this.user.password)
            .then((studentData) => {
              if (studentData) {
                // Establecer el correo electrónico en AuthService
                this.authService.setCurrentUserEmail(this.user.email);

                // Navegar a la página de inicio
                this.router.navigate(['/folder/Inicio']);
              } else {
                this.errorMessage = 'Correo o contraseña incorrectos para el estudiante.';
              }
            })
            .catch((error: any) => { // Especifica el tipo `error`
              this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
              console.error('Error de inicio de sesión:', error);
            });
        }
      }, (error: any) => { // Error del `subscribe`
        this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
        console.error('Error al verificar invitado:', error);
      });
  }

  clearField(field: keyof typeof this.user) {
    this.user[field] = '';
  }
}


