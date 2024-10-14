import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import { VentasAuthService } from '../services/ventas.service';
import { GestorEventosService } from '../services/gestoreventos.service';



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
    private invitadoService: InvitadoService,
    private uventasService: VentasAuthService,
    private gestorEventosService: GestorEventosService, // Inyecta el servicio GestorEventosService
    private router: Router
  ) {}

  ngOnInit() {}

  iniciarSesion() {
    console.log('Correo:', this.user.email);
    console.log('Contraseña:', this.user.password);

    // Verifica si el usuario es un invitado por su correo
    this.invitadoService.verificarInvitadoPorCorreo(this.user.email)
      .subscribe((esInvitado: boolean) => {
        if (esInvitado) {
          this.invitadoService.obtenerInvitadoPorEmail(this.user.email)
            .then((invitado) => {
              if (invitado && invitado.password === this.user.password) {
                console.log('Inicio de sesión como invitado exitoso:', invitado);
                this.invitadoService.setCurrentUserEmail(this.user.email);
                this.router.navigate(['/folder/Inicio']);
              } else {
                this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';
              }
            })
            .catch((error: any) => {
              this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
              console.error('Error al obtener invitado:', error);
            });
        } else {
          // Si no es invitado, verifica si es estudiante
          this.authService.login(this.user.email, this.user.password)
            .then((studentData) => {
              if (studentData) {
                console.log('Inicio de sesión como estudiante exitoso:', studentData);
                this.authService.setCurrentUserEmail(this.user.email);
                this.router.navigate(['/folder/Inicio']);
              } else {
                // Si no es estudiante, intenta con UVentas
                this.uventasService.login(this.user.email, this.user.password)
                  .then((ventasData) => {
                    if (ventasData) {
                      console.log('Inicio de sesión como usuario de ventas exitoso:', ventasData);
                      this.uventasService.setCurrentUserEmail(this.user.email);
                      this.router.navigate(['/folder-ventas']);
                    } else {
                      // Si no es usuario de ventas, intenta con GestorEventos
                      this.gestorEventosService.login(this.user.email, this.user.password)
                        .then((gestorData) => {
                          if (gestorData) {
                            console.log('Inicio de sesión como GestorEventos exitoso:', gestorData);
                            this.gestorEventosService.setCurrentUserEmail(this.user.email);
                            this.router.navigate(['/folder-gestor-eventos']); // Redirigir a la página de eventos
                          } else {
                            this.errorMessage = 'Correo o contraseña incorrectos para usuario de eventos.';
                          }
                        })
                        .catch((error: any) => {
                          this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
                          console.error('Error de inicio de sesión en eventos:', error);
                        });
                    }
                  })
                  .catch((error: any) => {
                    this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
                    console.error('Error de inicio de sesión en ventas:', error);
                  });
              }
            })
            .catch((error: any) => {
              this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
              console.error('Error de inicio de sesión como estudiante:', error);
            });
        }
      }, (error: any) => {
        this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
        console.error('Error al verificar invitado:', error);
      });
  }

  clearField(field: keyof typeof this.user) {
    this.user[field] = '';
  }
}



