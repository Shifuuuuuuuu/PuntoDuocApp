import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import { VentasAuthService } from '../services/ventas.service';
import { GestorEventosService } from '../services/gestoreventos.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';



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
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {}

  iniciarSesion() {
    console.log('Correo:', this.user.email);
    console.log('Contraseña:', this.user.password);

    // Verificar primero las credenciales con Firebase Authentication para estudiantes
    this.authService.login(this.user.email, this.user.password)
      .then((studentData) => {
        // Si se autentica como estudiante
        console.log('Inicio de sesión como estudiante exitoso:', studentData);
        this.authService.setCurrentUserEmail(this.user.email);
        this.router.navigate(['/folder/Inicio']);
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          // Si no es estudiante, intentar iniciar sesión como invitado
          this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password)
            .then((userCredential) => {
              // Obtener el correo del usuario autenticado
              const authUserEmail = userCredential.user?.email;
              if (authUserEmail) {
                // Verificar si el email pertenece a un invitado en Firestore
                this.invitadoService.obtenerInvitadoPorEmail(authUserEmail)
                  .subscribe((invitado) => {
                    if (invitado) {
                      console.log('Inicio de sesión como invitado exitoso:', invitado);
                      this.invitadoService.setCurrentUserEmail(authUserEmail);
                      this.router.navigate(['/folder/Inicio']);
                    } else {
                      this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';
                    }
                  }, (error: any) => {
                    this.errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo.';
                    console.error('Error al obtener invitado:', error);
                  });
              }
            })
            .catch((error) => {
              this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';
              console.error('Error de inicio de sesión como invitado:', error);
            });
        } else {
          this.errorMessage = 'Correo o contraseña incorrectos.';
          console.error('Error de inicio de sesión como estudiante:', error);
        }
      })
      .finally(() => {
        // Verificar si es usuario de ventas o gestor de eventos
        this.verificarUsuarioVentasOEventos(this.user.email, this.user.password);
      });
  }

  verificarUsuarioVentasOEventos(email: string, password: string) {
    // Primero verificar si es un usuario de ventas
    this.uventasService.login(email, password)
      .then((ventasData) => {
        if (ventasData) {
          console.log('Inicio de sesión como usuario de ventas exitoso:', ventasData);
          this.uventasService.setCurrentUserEmail(email);
          this.router.navigate(['/folder-ventas']);
        } else {
          // Si no es usuario de ventas, intentar con GestorEventos
          this.gestorEventosService.login(email, password)
            .then((gestorData) => {
              if (gestorData) {
                console.log('Inicio de sesión como GestorEventos exitoso:', gestorData);
                this.gestorEventosService.setCurrentUserEmail(email);
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





  clearField(field: keyof typeof this.user) {
    this.user[field] = '';
  }
}



