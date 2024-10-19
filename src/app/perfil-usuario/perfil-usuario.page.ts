import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { Router } from '@angular/router';
import { QRCodeData } from '../interface/IQR';
import { firstValueFrom, Subscription } from 'rxjs';
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
  public tempNombreCompleto: string = '';
  public tempEmail: string = '';
  public tempRut: string = '';
  public tempTelefono: string = '';

  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private authService: AuthService, // Servicio para estudiantes
    private invitadoService: InvitadoService, // Servicio para invitados
    private router: Router
  ) {}

  ngOnInit() {
    // Suscribirse al observable de AuthService para Estudiantes
    this.authSubscription = this.authService.getCurrentUserEmail().subscribe(email => {
      if (email) {
        this.userEmail = email;
        this.loadUserData();
      } else {
        // Si no hay email en AuthService, suscribirse a InvitadoService
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
  }

  // Cargar los datos del usuario
  async loadUserData() {
    if (!this.userEmail) {
      console.error('Error: userEmail no está definido.');
      return;
    }

    try {
      // Primero buscar en la colección de estudiantes
      const estudianteResult = await firstValueFrom(this.authService.getEstudianteByEmails(this.userEmail));
      if (estudianteResult) {
        this.estudiante = estudianteResult;
        this.isInvitado = false;
        this.generateQrData(); // Generar el QR si es un estudiante
      } else {
        // Si no es estudiante, buscar en la colección de invitados
        const invitadoResult = await firstValueFrom(this.invitadoService.obtenerInvitadoPorEmail(this.userEmail));
        if (invitadoResult) {
          this.invitado = invitadoResult;
          this.isInvitado = true;
          this.generateQrData(); // Generar el QR si es un invitado
        } else {
          console.error('No se encontró ningún invitado con ese email.');
          this.router.navigate(['/iniciar-sesion']);
        }
      }
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.errorMessage = 'Error al cargar los datos del usuario.';
      this.router.navigate(['/iniciar-sesion']);
    }
  }

  // Generar datos QR con la información del usuario
  generateQrData() {
    const eventosInscritos = this.isInvitado
      ? this.invitado?.eventosInscritos || []
      : this.estudiante?.eventosInscritos || [];

    const qrDataObject: QRCodeData = {
      qrData: JSON.stringify({
        userId: this.isInvitado ? this.invitado?.id_Invitado : this.estudiante?.id_estudiante,
        eventosInscritos: eventosInscritos
      }),
      userId: this.isInvitado ? (this.invitado?.id_Invitado || '') : (this.estudiante?.id_estudiante || ''),
      eventosInscritos: eventosInscritos
    };

    this.qrData = qrDataObject.qrData;
  }

  // Activar modo de edición del perfil
  editProfile() {
    this.isEditing = true;
    // Inicializa las variables temporales con los datos actuales o un valor predeterminado
    this.tempNombreCompleto = this.estudiante?.Nombre_completo || this.invitado?.Nombre_completo || '';
    this.tempEmail = this.estudiante?.email || this.invitado?.email || '';
    this.tempRut = this.estudiante?.Rut || this.invitado?.Rut || '';
    this.tempTelefono = this.estudiante?.Telefono || this.invitado?.Telefono || '';
  }


  // Guardar cambios del perfil
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
        // No se actualiza el puntaje, ya que no se puede editar
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
    // Aquí podrías también volver a cargar los datos desde Firestore
    this.loadUserData();
  }
  // Cerrar sesión con confirmación
  confirmLogout() {
    if (!this.isEditing) {
      this.logout();
    } else {
      this.errorMessage = 'Por favor, guarda los cambios antes de cerrar sesión.';
    }
  }

  // Método para salir de la página solo si no está editando
  canGoBack() {
    return !this.isEditing; // Solo permite volver si no se está editando
  }

  // Cerrar sesión
  logout() {
    this.authService.logout(); // Cerrar sesión del servicio de autenticación
    console.log('Cerrando sesión...');
    this.router.navigate(['/iniciar-sesion']); // Redirigir a la página de inicio de sesión
  }
}
