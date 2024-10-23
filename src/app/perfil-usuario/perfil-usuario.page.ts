import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { Router } from '@angular/router';
import { QRCodeData, QRCodeData2 } from '../interface/IQR';
import { firstValueFrom, Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import { AlertController } from '@ionic/angular';
@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  estudiante: Estudiante | null = null;
  invitado: Invitado | null = null;
  isEditing: boolean = false;
  userEmail!: string | undefined;
  errorMessage: string | undefined;
  qrData: string = '';
  isInvitado: boolean = false;
  eventoId: string = '';
  public tempNombreCompleto: string = '';
  public tempEmail: string = '';
  public tempRut: string = '';
  public tempTelefono: string = '';
  puntajeCargado: number = 0;
  haSidoVerificado: boolean = false;
  escaneoCompletado: boolean = false;
  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;
  private verificacionSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private cartService: CartService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.authSubscription = this.authService.getCurrentUserEmail().subscribe(email => {
      if (email) {
        this.userEmail = email;
        this.loadUserData();
      } else {
        this.invitadoSubscription = this.invitadoService.getCurrentUserEmail().subscribe(async invEmail => {
          if (invEmail) {
            this.userEmail = invEmail;
            await this.loadUserData();
          } else {
            this.errorMessage = 'Error: currentUserEmail no está definido.';
            console.error(this.errorMessage);
            this.router.navigate(['/iniciar-sesion']);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.invitadoSubscription) {
      this.invitadoSubscription.unsubscribe();
    }
    if (this.verificacionSubscription) {
      this.verificacionSubscription.unsubscribe();
    }
  }

  // Cargar los datos del usuario
  async loadUserData() {
    if (!this.userEmail) {
      console.error('Error: userEmail no está definido.');
      return;
    }

    try {
      const estudianteResult = await firstValueFrom(this.authService.getEstudianteByEmails(this.userEmail));
      if (estudianteResult) {
        this.estudiante = estudianteResult;
        this.eventoId = this.estudiante.eventosInscritos?.[0] || ''; // Asignar eventoId correctamente
      } else {
        const invitadoResult = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(this.userEmail));
        if (invitadoResult) {
          this.invitado = invitadoResult;
          this.eventoId = this.invitado.eventosInscritos?.[0] || ''; // Asignar eventoId correctamente
        } else {
          console.error('No se encontró ningún invitado con ese email.');
          this.router.navigate(['/iniciar-sesion']);
        }
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  // Método para iniciar la verificación del escaneo de QR
  async verificarInscripcionAlEscanear() {
    try {
      const qrData = await this.cartService.startScan();  // Iniciar el escaneo del QR
      if (qrData) {
        this.escaneoCompletado = true;  // Marcar que se ha completado el escaneo
        // Verificar la inscripción después del escaneo
        await this.verificarInscripcionEventos(qrData.id_estudiante || qrData.id_Invitado, this.eventoId, true); // Mostrar alerta cuando se escanea
      }
    } catch (error) {
      console.error('Error al escanear el código QR:', error);
    }
  }

  // Verificar si el estudiante o invitado ya está verificado en los eventos inscritos
  async verificarInscripcionEventos(userId: string | undefined, eventoId: string, mostrarAlerta: boolean = false) {
    if (!userId || this.haSidoVerificado) return; // No verificar si ya se ha verificado o no hay usuario

    try {
      const qrData: QRCodeData2 = {
        id_estudiante: this.isInvitado ? undefined : userId,
        id_Invitado: this.isInvitado ? userId : undefined,
        qrData: '',
        eventosInscritos: [],
        tipo: this.isInvitado ? 'Invitado' : 'Estudiante',
      };

      const resultado = await this.cartService.verifyAndUpdateInscription(qrData, eventoId);

      // Si el usuario ha sido verificado correctamente y no ha sido verificado antes
      if (resultado.verificado && !this.haSidoVerificado) {
        this.haSidoVerificado = true; // Marcar como verificado

        // Mostrar alertas solo cuando se escanea el QR
        if (mostrarAlerta && this.escaneoCompletado) {  // Solo si se escanea
          if (resultado.puntaje) {
            await this.mostrarAlertaVerificacion(resultado.puntaje, eventoId); // Mostrar alerta de verificación exitosa
          } else {
            await this.mostrarAlertaYaVerificado();
          }
        }
      } else if (!resultado.verificado) {
        console.error('No se pudo verificar la inscripción.');
      }
    } catch (error) {
      console.error('Error al verificar la inscripción mediante QR:', error);
    }
  }

  // Función para mostrar una alerta cuando el usuario está verificado en un evento
  async mostrarAlertaVerificacion(puntaje: number, eventoId: string) {
    const alert = await this.alertController.create({
      header: '¡Verificación Exitosa!',
      subHeader: `Evento ID: ${eventoId}`,
      message: `Has sido verificado en el evento. Tu puntaje actual es: ${puntaje} puntos.`,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Mostrar alerta de ya verificado
  async mostrarAlertaYaVerificado() {
    const alert = await this.alertController.create({
      header: 'Ya verificado',
      message: 'Ya has sido verificado para este evento.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Generar datos QR con la información del usuario
  generateQrData() {
    const eventosInscritos = this.isInvitado
      ? this.invitado?.eventosInscritos || []
      : this.estudiante?.eventosInscritos || [];

    const qrDataObject: QRCodeData = {
      qrData: JSON.stringify({
        userId: this.isInvitado ? this.invitado?.id_Invitado : this.estudiante?.id_estudiante,
        eventosInscritos: eventosInscritos,
      }),
      userId: this.isInvitado ? (this.invitado?.id_Invitado || '') : (this.estudiante?.id_estudiante || ''),
      eventosInscritos: eventosInscritos,
    };

    this.qrData = qrDataObject.qrData;
  }


  // Activar el modo de edición del perfil
  editProfile() {
    this.isEditing = true;
    this.tempNombreCompleto = this.estudiante?.Nombre_completo || this.invitado?.Nombre_completo || '';
    this.tempEmail = this.estudiante?.email || this.invitado?.email || '';
    this.tempRut = this.estudiante?.Rut || this.invitado?.Rut || '';
    this.tempTelefono = this.estudiante?.Telefono || this.invitado?.Telefono || '';
  }

  // Guardar los cambios del perfil
  async saveProfile() {
    try {
      if (this.isInvitado && this.invitado) {
        this.invitado.Nombre_completo = this.tempNombreCompleto;
        this.invitado.email = this.tempEmail;
        this.invitado.Rut = this.tempRut;
        this.invitado.Telefono = this.tempTelefono;
        await this.invitadoService.updateInvitado(this.invitado);
      } else if (this.estudiante) {
        this.estudiante.Nombre_completo = this.tempNombreCompleto;
        this.estudiante.email = this.tempEmail;
        this.estudiante.Rut = this.tempRut;
        this.estudiante.Telefono = this.tempTelefono;
        await this.authService.updateEstudiante(this.estudiante);
      }
      this.isEditing = false;
      console.log('Perfil actualizado exitosamente.');
    } catch (error) {
      console.error('Error al guardar el perfil:', error);
      this.errorMessage = 'Error al guardar el perfil.';
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.tempNombreCompleto = '';
    this.tempEmail = '';
    this.tempRut = '';
    this.tempTelefono = '';
    this.loadUserData();
  }

  confirmLogout() {
    if (!this.isEditing) {
      this.logout();
    } else {
      this.errorMessage = 'Por favor, guarda los cambios antes de cerrar sesión.';
    }
  }

  logout() {
    this.authService.logout();
    console.log('Cerrando sesión...');
    this.router.navigate(['/iniciar-sesion']);
  }
}
