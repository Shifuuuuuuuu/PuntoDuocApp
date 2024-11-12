import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import { VentasAuthService } from '../services/ventas.service';
import { GestorEventosService } from '../services/gestoreventos.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MenuController } from '@ionic/angular';
import { EstudianteService } from '../services/estudiante.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';


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
    private menu: MenuController,
    private estudianteService: EstudianteService
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }

  ngOnInit() {}

  async iniciarSesion() {
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
        if (studentData && studentData.id_estudiante) {
          // Verificar si el estudiante está verificado
          if (!studentData.verificado) {
            Swal.fire('Error', 'Primero te tienes que verificar en el correo que se te mandó.', 'error');
            return;
          }

          console.log('Inicio de sesión como estudiante exitoso:', studentData);
          this.authService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'estudiante');
          localStorage.setItem('id', studentData.id_estudiante);

          // Obtener y actualizar el token FCM
          try {
            const tokenFCM = await this.estudianteService.solicitarPermisosYObtenerToken(studentData.id_estudiante);
            if (tokenFCM) {
              console.log('Token FCM obtenido al iniciar sesión:', tokenFCM);
              await this.authService.updateEstudiante({
                ...studentData,
                tokenFCM: tokenFCM
              });
            }
          } catch (error) {
            console.error('No se pudo obtener el token FCM al iniciar sesión:', error);
          }

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
async iniciarSesionComoInvitado() {
  console.log('Intentando iniciar sesión como invitado con:', this.user.email);

  this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password)
    .then(async (userCredential) => {
      if (userCredential && userCredential.user) {
        const authUserEmail = userCredential.user.email;
        if (authUserEmail) {
          console.log('Inicio de sesión como invitado exitoso:', userCredential);

          // Obtener datos del invitado por correo
          const invitadoData = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(authUserEmail));

          if (invitadoData && !invitadoData.verificado) {
            Swal.fire('Error', 'Primero te tienes que verificar en el correo que se te mandó.', 'error');
            return;
          }

          this.invitadoService.setCurrentUserEmail(authUserEmail);
          localStorage.setItem('userType', 'invitado'); // Almacenar tipo de usuario como invitado
          localStorage.setItem('id', userCredential.user.uid); // Guardar el ID del invitado
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
  
          // Use nullish coalescing to provide a default string in case id_Uventas is undefined
          const ventasUserId = ventasData.id_Uventas ?? 'default_id'; // 'default_id' is a fallback value
  
          localStorage.setItem('ventasUserId', ventasUserId);
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


