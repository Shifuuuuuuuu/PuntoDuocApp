import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';
import { QRCodeData } from '../interface/IQR';
import { NavController } from '@ionic/angular';
import * as QRCode from 'qrcode';
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
  tempNombreCompleto: string = '';
  tempEmail: string = '';
  tempRut: string = '';
  tempTelefono: string = '';
  puntajeCargado: number = 200;
  haSidoVerificado: boolean = false;
  escaneoCompletado: boolean = false;
  eventoVerificadoId: string | null = null;  // ID del último evento verificado
  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private cartService: CartService,
    private router: Router,
    private navCtrl: NavController
  ) {}

  async ngOnInit() {
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
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.invitadoSubscription?.unsubscribe();
  }

  async loadUserData() {
    if (!this.userEmail) {
      this.errorMessage = 'Error: userEmail no está definido.';
      return;
    }

    try {
      const estudianteResult = await firstValueFrom(this.authService.getEstudianteByEmails(this.userEmail));
      if (estudianteResult) {
        this.estudiante = estudianteResult;
        this.eventoId = this.estudiante.eventosInscritos?.[0] || '';
        this.isInvitado = false;
      } else {
        const invitadoResult = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(this.userEmail));
        if (invitadoResult) {
          this.invitado = invitadoResult;
          this.eventoId = this.invitado.eventosInscritos?.[0] || '';
          this.isInvitado = true;
        } else {
          this.errorMessage = 'No se encontró ningún invitado con ese email.';
        }
      }

      // Generar el QR después de cargar los datos del usuario
      await this.generateQrData();

      if (this.userEmail && this.eventoId) {
        await this.verificarEstadoAcreditacion();
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  async verificarEstadoAcreditacion() {
    try {
      if (this.userEmail && this.eventoId) {
        const inscripcion = await this.cartService.getInscripcionVerificada(this.userEmail, this.eventoId);

        if (inscripcion?.verificado && this.eventoVerificadoId !== this.eventoId) {
          this.haSidoVerificado = true;
          this.eventoVerificadoId = this.eventoId; // Guardar ID del evento verificado
          this.puntajeCargado = inscripcion.puntaje || 0; // Asignar puntaje si está disponible

          // Obtener el título del evento desde Firestore
          const eventoData = await this.cartService.getEvento(this.eventoId);
          const tituloEvento = eventoData?.titulo || "Evento";

          // Mensaje diferente para invitados y estudiantes
          const mensaje = this.isInvitado
            ? `Ya estás acreditado para el evento ${tituloEvento}.`
            : `Ya estás acreditado para el evento ${tituloEvento}`;

          this.presentSweetAlert('Acreditación Exitosa', mensaje, 'success');
        }
      } else {
        console.error('userEmail o eventoId no están definidos.');
      }
    } catch (error) {
      console.error('Error al verificar el estado de acreditación:', error);
    }
  }

  async presentSweetAlert(title: string, text: string, icon: 'success' | 'error' | 'info') {
    Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonText: 'OK'
    });
  }


  // Funciones de edición de perfil
  editProfile() {
    this.isEditing = true;
    this.tempNombreCompleto = this.estudiante?.Nombre_completo || this.invitado?.Nombre_completo || '';
    this.tempEmail = this.estudiante?.email || this.invitado?.email || '';
    this.tempRut = this.estudiante?.Rut || this.invitado?.Rut || '';
    this.tempTelefono = this.estudiante?.Telefono || this.invitado?.Telefono || '';
  }

  async saveProfile() {
    try {
      if (this.isInvitado && this.invitado) {
        // Actualiza los datos temporales del invitado
        this.invitado.Nombre_completo = this.tempNombreCompleto;
        this.invitado.Rut = this.tempRut;
        this.invitado.Telefono = this.tempTelefono;

        // Llama a la función para actualizar el QR con los nuevos datos
        this.generateQrData();

        // Actualiza en Firestore el invitado junto con el nuevo código QR
        await this.invitadoService.updateInvitado({
          ...this.invitado,
          codigoQr: this.qrData // Guarda el nuevo código QR en Firestore
        });
      } else if (this.estudiante) {
        // Actualiza los datos temporales del estudiante
        this.estudiante.Nombre_completo = this.tempNombreCompleto;
        this.estudiante.Rut = this.tempRut;
        this.estudiante.Telefono = this.tempTelefono;

        // Llama a la función para actualizar el QR con los nuevos datos
        this.generateQrData();

        // Actualiza en Firestore el estudiante junto con el nuevo código QR
        await this.authService.updateEstudiante({
          ...this.estudiante,
          codigoQr: this.qrData // Guarda el nuevo código QR en Firestore
        });
      }

      this.isEditing = false;

      // Alerta de confirmación de actualización
      Swal.fire({
        title: 'Perfil Actualizado',
        text: 'Los cambios en tu perfil se han guardado correctamente.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

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
    this.router.navigate(['/iniciar-sesion']);
  }
  async generateQrData() {
    const eventosInscritos = this.isInvitado
      ? this.invitado?.eventosInscritos || []
      : this.estudiante?.eventosInscritos || [];

    const qrDataObject = {
      userId: this.isInvitado ? this.invitado?.id_Invitado : this.estudiante?.id_estudiante,
      eventosInscritos: eventosInscritos,
      nombreCompleto: this.isInvitado ? this.invitado?.Nombre_completo : this.estudiante?.Nombre_completo,
      rut: this.isInvitado ? this.invitado?.Rut : this.estudiante?.Rut,
      telefono: this.isInvitado ? this.invitado?.Telefono : this.estudiante?.Telefono,
    };

    // Convierte el JSON en una cadena
    const qrString = JSON.stringify(qrDataObject);

    // Genera la imagen QR y guárdala en `this.qrData`
    this.qrData = await QRCode.toDataURL(qrString);
  }
  irAConsultas() {
    this.navCtrl.navigateForward('/consultas'); // Ruta de la página de consultas
  }
  irARecomendacion() {
    this.navCtrl.navigateForward('/recomendacion'); // Redirige a la página de recomendación
  }

}
