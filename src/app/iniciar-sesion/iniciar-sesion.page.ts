import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import { VentasAuthService } from '../services/ventas.service';
import { GestorEventosService } from '../services/gestoreventos.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { firstValueFrom } from 'rxjs';
import { MenuController } from '@ionic/angular';



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
    private afAuth: AngularFireAuth,
    private menu: MenuController
  ) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }
  ngOnInit() {}

  iniciarSesion() {
    console.log('Correo:', this.user.email);
    console.log('Contraseña:', this.user.password);

    // Intentar iniciar sesión como estudiante
    this.authService.login(this.user.email, this.user.password)
      .then(async (studentData) => {
        // Si se autentica como estudiante
        if (studentData) {
          console.log('Inicio de sesión como estudiante exitoso:', studentData);
          this.authService.setCurrentUserEmail(this.user.email);
          this.router.navigate(['/folder/Inicio']);
        } else {
          this.errorMessage = 'No se pudo encontrar un estudiante con este correo.';

          // Si no se autentica como estudiante, intentar como invitado
          await this.iniciarSesionComoInvitado(); // Llama al método de invitado aquí
        }
      })
      .catch(async (error) => {
        console.error('Error al intentar iniciar sesión como estudiante:', error);
        // Intentar iniciar sesión como invitado si falla la autenticación de estudiante
        await this.iniciarSesionComoInvitado();
      });
  }

  // Método para manejar la sesión como invitado
  iniciarSesionComoInvitado() {
    console.log('Intentando iniciar sesión como invitado con:', this.user.email);

    // Usar AngularFireAuth directamente para autenticar al invitado
    this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password)
      .then(async (userCredential) => {
        // Asegúrate de que userCredential no sea null
        if (userCredential && userCredential.user) {
          const authUserEmail = userCredential.user.email;

          // Verificar que el email no sea nulo
          if (authUserEmail) {
            // Si el invitado se autentica correctamente
            console.log('Inicio de sesión como invitado exitoso:', userCredential);
            this.invitadoService.setCurrentUserEmail(authUserEmail);
            this.router.navigate(['/folder/Inicio']);
          } else {
            this.errorMessage = 'No se pudo autenticar al invitado. El correo es nulo.';
          }
        } else {
          this.errorMessage = 'No se pudo autenticar al invitado.';
        }
      })
      .catch((error) => {
        console.error('Error de inicio de sesión como invitado:', error);
        this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';

        // Validar usuarios de Uventas y Gestor Eventos después de fallar con invitado
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



