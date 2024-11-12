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
import { Estudiante, EstudianteSinPassword } from '../interface/IEstudiante';
import { Invitado, InvitadoSinPassword } from '../interface/IInvitado';


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
    this.menu.enable(false); // Deshabilita el menú en esta página
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

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.user.email, this.user.password);

      if (userCredential.user) {
        // Verificar y actualizar la verificación de correo en Firestore
        await this.verificarYActualizarVerificacion(userCredential.user);

        // Verificar si el usuario es estudiante y redirigir
        const estudianteData: Estudiante | null = await this.estudianteService.obtenerEstudiantePorEmail(this.user.email);

        if (estudianteData && estudianteData.verificado !== undefined) {
          if (!estudianteData.verificado) {
            Swal.fire('Error', 'Primero debes verificar tu correo electrónico.', 'error');
            return;
          }

          console.log('Inicio de sesión como estudiante exitoso:', estudianteData);
          this.authService.setCurrentUserEmail(this.user.email);
          localStorage.setItem('userType', 'estudiante');
          localStorage.setItem('id', estudianteData.id_estudiante || '');

          // Obtener y actualizar el token FCM si `id_estudiante` no es undefined
          if (estudianteData.id_estudiante) {
            try {
              const tokenFCM = await this.estudianteService.solicitarPermisosYObtenerToken(estudianteData.id_estudiante);
              if (tokenFCM) {
                await this.estudianteService.updateEstudiante({ ...estudianteData, tokenFCM });
                console.log('Token FCM actualizado:', tokenFCM);
              }
            } catch (error) {
              console.error('No se pudo obtener el token FCM al iniciar sesión:', error);
            }
          }

          this.router.navigate(['/folder/Inicio']);
        } else {
          await this.iniciarSesionComoInvitado();
        }
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión como estudiante:', error);
      await this.iniciarSesionComoInvitado();
    }
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

        console.log('Verificación de correo actualizada en Firestore.');
      } catch (error) {
        console.error('Error al actualizar la verificación en Firestore:', error);
      }
    }
  }



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

  validarCorreo(correo: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|duocuc\.cl)$/;
    return emailRegex.test(correo);
  }

  validarContraseña(contraseña: string): boolean {
    return contraseña.length >= 8 && contraseña.length <= 20;
  }
}


