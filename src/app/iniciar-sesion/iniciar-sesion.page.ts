import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';
import { VentasAuthService } from '../services/ventas.service';
import { GestorEventosService } from '../services/gestoreventos.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoadingController, MenuController } from '@ionic/angular';
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
    private estudianteService: EstudianteService,
    private loadingController: LoadingController
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false); // Deshabilita el menú en esta página
    this.cargarCredenciales(); // Carga las credenciales si están almacenadas
  }

  ngOnInit() {
    // Cargar credenciales si la opción está habilitada
    this.cargarCredenciales();
  }

  // Método para iniciar sesión
  async iniciarSesion() {
    this.emailError = false;
    this.passwordError = false;
    this.errorMessage = '';

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

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión, por favor espera...',
      spinner: 'bubbles',
      cssClass: 'custom-loading'
    });
    await loading.present();

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password);

      if (userCredential.user) {
        console.log('Inicio de sesión autenticado por Firebase Auth:', userCredential);

        if (this.rememberMe) {
          this.guardarCredenciales(); // Guarda las credenciales si el usuario lo ha solicitado
        } else {
          this.eliminarCredenciales(); // Elimina las credenciales si la opción no está marcada
        }

        // Verificar si el usuario es Estudiante
        const estudianteData = await this.estudianteService.obtenerEstudiantePorEmail(this.user.email);
        if (estudianteData) {
          if (!estudianteData.verificado) {
            await loading.dismiss(); // Cierra el loader
            Swal.fire('Error', 'Primero debes verificar tu correo electrónico.', 'error');
            return;
          }
          this.authService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'estudiante');
          localStorage.setItem('id', estudianteData.id_estudiante || '');

          if (estudianteData.id_estudiante) {
            try {
              const tokenFCM = await this.estudianteService.solicitarPermisosYObtenerToken(estudianteData.id_estudiante);
              if (tokenFCM) {
                await this.estudianteService.updateEstudiante({ ...estudianteData, tokenFCM });
              }
            } catch (error) {
              console.error('No se pudo obtener el token FCM al iniciar sesión:', error);
            }
          }
          await loading.dismiss();
          this.router.navigate(['/folder/Inicio']);
          return;
        }

        // Verificar si el usuario es Invitado
        const invitadoData = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(this.user.email));
        if (invitadoData) {
          if (!invitadoData.verificado) {
            await loading.dismiss();
            Swal.fire('Error', 'Primero debes verificar tu correo electrónico.', 'error');
            return;
          }
          this.invitadoService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'invitado');
          localStorage.setItem('id', userCredential.user.uid);
          await loading.dismiss();
          this.router.navigate(['/folder/Inicio']);
          return;
        }

        // Verificar si el usuario es de UVentas
        const ventasData = await this.uventasService.getUsuarioVentasByEmail(this.user.email);
        if (ventasData) {
          if (ventasData.password !== this.user.password) {
            this.errorMessage = 'Correo o contraseña incorrectos para usuario de ventas.';
            await loading.dismiss();
            return;
          }
          this.uventasService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'ventas');
          localStorage.setItem('ventasUserId', ventasData.id_Uventas || '');
          await loading.dismiss();
          this.router.navigate(['/folder-ventas']);
          return;
        }

        // Verificar si el usuario es GestorEventos
        const gestorData = await this.gestorEventosService.getGestorByEmail(this.user.email);
        if (gestorData) {
          if (gestorData.password !== this.user.password) {
            this.errorMessage = 'Correo o contraseña incorrectos para Gestor de Eventos.';
            await loading.dismiss();
            return;
          }
          this.gestorEventosService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'gestorEventos');
          localStorage.setItem('gestorUserId', gestorData.id_Geventos || '');
          await loading.dismiss();
          this.router.navigate(['/folder-gestor-eventos']);
          return;
        }

        this.errorMessage = 'No se encontró ningún usuario con este correo en la base de datos.';
        await loading.dismiss();
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Firebase Authentication:', error);
      this.errorMessage = 'Correo o contraseña incorrectos.';
      await loading.dismiss();
    }
  }

  // Método para cargar credenciales del localStorage
  cargarCredenciales() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const rememberMeFlag = localStorage.getItem('rememberMe') === 'true';

    if (rememberMeFlag && savedEmail && savedPassword) {
      this.user.email = savedEmail;
      this.user.password = savedPassword;
      this.rememberMe = true;
    }
  }

  // Método para guardar credenciales en el localStorage
  guardarCredenciales() {
    localStorage.setItem('rememberedEmail', this.user.email);
    localStorage.setItem('rememberedPassword', this.user.password);
    localStorage.setItem('rememberMe', 'true');
  }

  // Método para eliminar credenciales del localStorage
  eliminarCredenciales() {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');
  }

  validarCorreo(correo: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|duocuc\.cl)$/;
    return emailRegex.test(correo);
  }

  validarContraseña(contraseña: string): boolean {
    return contraseña.length >= 8 && contraseña.length <= 20;
  }




  async iniciarSesionComoInvitado() {
    console.log('Intentando iniciar sesión como invitado con:', this.user.email);

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password);

      if (userCredential.user) {
        // Verificar y actualizar la verificación de correo en Firestore
        await this.verificarYActualizarVerificacion(userCredential.user);

        const authUserEmail = userCredential.user.email;
        if (authUserEmail) {
          console.log('Inicio de sesión como invitado exitoso:', userCredential);

          // Obtener datos del invitado por correo usando firstValueFrom
          const invitadoData = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(authUserEmail));
          if (invitadoData && 'verificado' in invitadoData) {
            if (!invitadoData.verificado) {
              Swal.fire('Error', 'Primero debes verificar tu correo electrónico.', 'error');
              return;
            }

            this.invitadoService.setCurrentUserEmail(authUserEmail);
            localStorage.setItem('userType', 'invitado');
            localStorage.setItem('id', userCredential.user.uid);

            this.router.navigate(['/folder/Inicio']);
          } else {
            this.errorMessage = 'No se pudo autenticar al invitado. El correo es nulo.';
          }
        } else {
          this.errorMessage = 'No se pudo autenticar al invitado.';
        }
      }
    } catch (error) {
      console.error('Error de inicio de sesión como invitado:', error);
      this.errorMessage = 'Correo o contraseña incorrectos para el invitado.';
      this.verificarUsuarioVentasOEventos(this.user.email, this.user.password);
    }
  }



  async verificarYActualizarVerificacion(user: any) {
    await user.reload(); // Recargar la información del usuario
    if (user.emailVerified) {
      const userId = user.uid;
      try {
        // Obtener el documento actual del estudiante e invitado
        const estudianteData = await this.estudianteService.obtenerEstudiantePorId(userId);
        const invitadoData = await this.invitadoService.obtenerInvitadoPorId(userId);

        if (estudianteData) {
          // Actualizar solo el campo `verificado` del estudiante
          estudianteData.verificado = true;
          await this.estudianteService.updateEstudiante(estudianteData);
        }

        if (invitadoData) {
          // Actualizar solo el campo `verificado` del invitado
          invitadoData.verificado = true;
          await this.invitadoService.updateInvitado(invitadoData);
        }
      } catch (error) {
        console.error('Error al actualizar la verificación en Firestore:', error);
      }
    }
  }



  async verificarUsuarioVentasOEventos(email: string, password: string) {
    try {
      // Intentar iniciar sesión con Firebase Authentication
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);

      if (userCredential.user) {
        console.log('Inicio de sesión autenticado por Firebase Auth:', userCredential);

        // Verificar si el usuario es de ventas
        const ventasData = await this.uventasService.loginWithAuth(email, password);
        if (ventasData) {
          console.log('Inicio de sesión como usuario de ventas exitoso:', ventasData);
          this.uventasService.setCurrentUserEmail(email);
          localStorage.setItem('ventasUserId', ventasData.id_Uventas ?? 'default_id');
          this.router.navigate(['/folder-ventas']);
          return;
        }

        // Verificar si el usuario es un gestor de eventos
        const gestorData = await this.gestorEventosService.loginWithAuth(email, password);
        if (gestorData) {
          console.log('Inicio de sesión como GestorEventos exitoso:', gestorData);
          this.gestorEventosService.setCurrentUserEmail(email);
          localStorage.setItem('gestorUserId', gestorData.id_Geventos ?? 'default_id');
          this.router.navigate(['/folder-gestor-eventos']);
          return;
        }

        // Si no se encuentra en ninguna de las categorías
        this.errorMessage = 'Correo o contraseña incorrectos para usuario de ventas o eventos.';
      }
    } catch (error) {
      console.error('Error al iniciar sesión con Firebase Authentication:', error);
      this.errorMessage = 'Correo o contraseña incorrectos para el usuario.';
    }
  }

  clearField(field: keyof typeof this.user) {
    this.user[field] = '';
  }



  async openForgotPasswordAlert() {
    const { value: email } = await Swal.fire({
      title: 'Restablecer contraseña',
      input: 'email',
      inputLabel: 'Ingresa tu correo electrónico',
      inputPlaceholder: 'correo@ejemplo.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Por favor, ingresa un correo electrónico';
        }
        // Debe devolver `undefined` para indicar que no hay errores.
        return undefined;
      }
    });

    if (email) {
      try {
        const loading = await this.loadingController.create({
          message: 'Enviando enlace de recuperación...',
          spinner: 'bubbles',
          cssClass: 'custom-loading'
        });
        await loading.present();

        await this.afAuth.sendPasswordResetEmail(email);

        await loading.dismiss();
        Swal.fire('Correo enviado', 'Se ha enviado un enlace de recuperación de contraseña a tu correo.', 'success');
      } catch (error) {
        console.error('Error al enviar el correo de recuperación de contraseña:', error);
        Swal.fire('Error', 'Hubo un problema al enviar el correo de recuperación. Por favor, inténtalo de nuevo.', 'error');

        const activeLoading = await this.loadingController.getTop();
        if (activeLoading) {
          await activeLoading.dismiss();
        }
      }
    }
  }

}


