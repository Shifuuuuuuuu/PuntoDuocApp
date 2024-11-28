import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';
import { MenuController, NavController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { NotificationService } from '../services/notification.service';
import { MissionsAlertService } from '../services/missions-alert.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {
  profileImageUrl: string = ''; // URL de la imagen de perfil
  defaultProfileImage: string = 'assets/icon/default-profile.png'; // Ruta del icono predeterminado
  estudiante: Estudiante | null = null;
  invitado: Invitado | null = null;
  isEditing: boolean = false;
  userEmail!: string | undefined;
  errorMessage: string | undefined;
  qrData: string = '';
  isInvitado: boolean = false;
  isStudent: boolean = false;
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
  unreadNotificationsCount: number = 0;
  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
    private cartService: CartService,
    private router: Router,
    private navCtrl: NavController,
    private menu: MenuController,
    private notificationService: NotificationService,
    private missionsAlertService: MissionsAlertService,
    private storage: AngularFireStorage,
  ) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }

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
            await this.loadProfileImage();
          } else {
            this.errorMessage = 'Error: currentUserEmail no está definido.';
          }
        });
      }
    });

    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }
  async loadProfileImage() {
    if (this.isInvitado && this.invitado) {
      this.profileImageUrl = this.invitado.imagen || this.defaultProfileImage;
    } else if (this.estudiante) {
      this.profileImageUrl = this.estudiante.imagen || this.defaultProfileImage;
    }
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.invitadoSubscription?.unsubscribe();
  }
  async uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const filePath = `profile_images/${this.userEmail}_${new Date().getTime()}`;
      const fileRef = this.storage.ref(filePath);

      // Subir el archivo a Firebase Storage
      const task = await this.storage.upload(filePath, file);

      // Obtener la URL de la imagen
      const imageUrl = await fileRef.getDownloadURL().toPromise();

      // Guardar la URL en Firestore
      if (this.isInvitado && this.invitado) {
        await this.invitadoService.updateInvitado({
          ...this.invitado,
          imagen: imageUrl,
        });
      } else if (this.estudiante) {
        await this.authService.updateEstudiante({
          ...this.estudiante,
          imagen: imageUrl,
        });
      }

      this.profileImageUrl = imageUrl;
      Swal.fire('Éxito', 'Imagen de perfil actualizada correctamente.', 'success');
    }
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
        this.profileImageUrl = this.estudiante.imagen || this.defaultProfileImage;
        this.qrData = this.estudiante.codigoQr || ''; // Cargar QR desde Firestore
        this.isInvitado = false;
        this.isStudent = true;
      } else {
        const invitadoResult = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(this.userEmail));
        if (invitadoResult) {
          this.invitado = invitadoResult;
          this.profileImageUrl = this.invitado.imagen || this.defaultProfileImage;
          this.qrData = this.invitado.codigoQr || ''; // Cargar QR desde Firestore
          this.isInvitado = true;
          this.isStudent = false;
        } else {
          this.errorMessage = 'No se encontró ningún invitado con ese email.';
        }
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
  this.isEditing = true; // Activar el modo de edición

  // Cargar temporalmente los datos actuales del usuario para permitir la edición
  this.tempNombreCompleto = this.estudiante?.Nombre_completo || this.invitado?.Nombre_completo || '';
  this.tempEmail = this.estudiante?.email || this.invitado?.email || '';
  this.tempRut = this.estudiante?.Rut || this.invitado?.Rut || '';
  this.tempTelefono = this.estudiante?.Telefono || this.invitado?.Telefono || '';

  // Asegurarse de que el ícono de la cámara esté visible para cambiar la imagen de perfil
  if (!this.profileImageUrl) {
    // Si no hay imagen de perfil cargada, mostrar el ícono predeterminado
    this.profileImageUrl = '';
  }
}


async saveProfile() {
  try {
    const newQrData = await this.generateQrData();
    this.qrData = newQrData;

    if (this.isInvitado && this.invitado) {
      // Actualizar datos del invitado
      this.invitado.Nombre_completo = this.tempNombreCompleto;
      this.invitado.Rut = this.tempRut;
      this.invitado.Telefono = this.tempTelefono;

      await this.invitadoService.updateInvitado({
        ...this.invitado,
        codigoQr: this.qrData, // Actualizar QR
      });

      Swal.fire('Éxito', 'Los cambios se guardaron correctamente.', 'success');
    } else if (this.isStudent && this.estudiante) {
      // Actualizar datos del estudiante
      this.estudiante.Nombre_completo = this.tempNombreCompleto;
      this.estudiante.Rut = this.tempRut;
      this.estudiante.Telefono = this.tempTelefono;

      await this.authService.updateEstudiante({
        ...this.estudiante,
        codigoQr: this.qrData, // Actualizar QR
      });

      Swal.fire('Éxito', 'Los cambios se guardaron correctamente.', 'success');
    }

    this.isEditing = false;
  } catch (error) {
    console.error('Error al guardar el perfil:', error);
    Swal.fire('Error', 'Hubo un problema al guardar los cambios.', 'error');
  }
}
  openMissionsModal() {
    this.missionsAlertService.showMissionsAlert();
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
  async generateQrData(): Promise<string> {
    const qrDataObject = this.isInvitado
      ? {
          userId: this.invitado?.id_Invitado || '',
          nombreCompleto: this.invitado?.Nombre_completo || '',
          rut: this.invitado?.Rut || '',
          telefono: this.invitado?.Telefono || '',
        }
      : {
          userId: this.estudiante?.id_estudiante || '',
          nombreCompleto: this.estudiante?.Nombre_completo || '',
          rut: this.estudiante?.Rut || '',
          telefono: this.estudiante?.Telefono || '',
          carrera: this.estudiante?.carrera || '',
        };

    try {
      const qrString = JSON.stringify(qrDataObject);
      return await QRCode.toDataURL(qrString);
    } catch (error) {
      console.error('Error al generar el QR:', error);
      throw error;
    }
  }

  irAConsultas() {
    this.navCtrl.navigateForward('/consultas'); // Ruta de la página de consultas
  }
  irARecomendacion() {
    this.navCtrl.navigateForward('/recomendacion'); // Redirige a la página de recomendación
  }

}
