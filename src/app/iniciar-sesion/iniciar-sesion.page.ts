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
  emailError: boolean = false;
  passwordError: boolean = false;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private uventasService: VentasAuthService,
    private gestorEventosService: GestorEventosService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private menu: MenuController
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }

  ngOnInit() {}

  iniciarSesion() {
    // Limpiar errores anteriores
    this.emailError = false;
    this.passwordError = false;
    this.errorMessage = '';

    // Validar correo y contraseña
    if (!this.validarCorreo(this.user.email)) {
      this.emailError = true;
      this.errorMessage = 'Por favor, introduce un correo electrónico válido.';
      return;
    }

    if (!this.validarContraseña(this.user.password)) {
      this.passwordError = true;
      this.errorMessage = 'La contraseña debe tener entre 8 y 20 caracteres.';
      return;
    }

    // Intentar iniciar sesión como estudiante
    this.authService.login(this.user.email, this.user.password)
      .then(async (studentData) => {
        if (studentData) {
          console.log('Inicio de sesión como estudiante exitoso:', studentData);
          this.authService.setCurrentUserEmail(this.user.email);
          this.router.navigate(['/folder/Inicio']);
        } else {
          this.errorMessage = 'No se pudo encontrar un estudiante con este correo.';
          await this.iniciarSesionComoInvitado();
        }
      })
      .catch(async (error) => {
        console.error('Error al intentar iniciar sesión como estudiante:', error);
        await this.iniciarSesionComoInvitado();
      });
  }

  // Método para manejar la sesión como invitado
  iniciarSesionComoInvitado() {
    console.log('Intentando iniciar sesión como invitado con:', this.user.email);

    this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password)
      .then(async (userCredential) => {
        if (userCredential && userCredential.user) {
          const authUserEmail = userCredential.user.email;
          if (authUserEmail) {
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
        this.verificarUsuarioVentasOEventos(this.user.email, this.user.password);
      });
  }

  // Verificar si el usuario es de ventas o de eventos
  verificarUsuarioVentasOEventos(email: string, password: string) {
    this.uventasService.login(email, password)
      .then((ventasData) => {
        if (ventasData) {
          console.log('Inicio de sesión como usuario de ventas exitoso:', ventasData);
          this.uventasService.setCurrentUserEmail(email);
          this.router.navigate(['/folder-ventas']);
        } else {
          this.gestorEventosService.login(email, password)
            .then((gestorData) => {
              if (gestorData) {
                console.log('Inicio de sesión como GestorEventos exitoso:', gestorData);
                this.gestorEventosService.setCurrentUserEmail(email);
                this.router.navigate(['/folder-gestor-eventos']);
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

  // Validación de correo
  validarCorreo(correo: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|duocuc\.cl)$/;
    return emailRegex.test(correo);
  }

  // Validación de contraseña
  validarContraseña(contraseña: string): boolean {
    return contraseña.length >= 8 && contraseña.length <= 20;
  }
}


