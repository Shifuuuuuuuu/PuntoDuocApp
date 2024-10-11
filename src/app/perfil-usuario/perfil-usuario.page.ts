import { Component, OnInit } from '@angular/core';
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado';
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service';
import { Router } from '@angular/router';
import { QRCodeData } from '../interface/IQR';
import { Subscription } from 'rxjs';
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

  private authSubscription!: Subscription;
  private invitadoSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private invitadoService: InvitadoService,
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
        this.invitadoSubscription = this.invitadoService.getCurrentUserEmail().subscribe(invEmail => {
          if (invEmail) {
            this.userEmail = invEmail;
            this.loadUserData();
          } else {
            this.errorMessage = 'Error: currentUserEmail no está definido. Asegúrate de que el usuario haya iniciado sesión correctamente.';
            console.error(this.errorMessage);
            this.router.navigate(['/iniciar-sesion']);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    // Desuscribirse para evitar fugas de memoria
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.invitadoSubscription) {
      this.invitadoSubscription.unsubscribe();
    }
  }

  async loadUserData() {
    if (!this.userEmail) {
      console.error('Error: userEmail no está definido.');
      return;
    }

    try {
      const estudianteResult = await this.authService.getEstudianteByEmail(this.userEmail);
      if (estudianteResult) {
        this.estudiante = estudianteResult;
        this.isInvitado = false;
        this.generateQrData();
      } else {
        const invitadoResult = await this.invitadoService.obtenerInvitadoPorEmail(this.userEmail);
        if (invitadoResult) {
          this.invitado = invitadoResult;
          this.isInvitado = true;
          this.generateQrData();
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

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  editProfile() {
    this.isEditing = true;
  }

  async saveProfile() {
    if (this.estudiante) {
      try {
        await this.authService.updateEstudiante(this.estudiante);
        this.isEditing = false;
        this.generateQrData(); // Actualizar QR después de guardar cambios
      } catch (error) {
        console.error('Error al actualizar el perfil del estudiante:', error);
        this.errorMessage = 'Error al actualizar el perfil del estudiante.';
      }
    } else if (this.invitado) {
      try {
        await this.invitadoService.updateInvitado(this.invitado);
        this.isEditing = false;
        this.generateQrData(); // Actualizar QR después de guardar cambios
      } catch (error) {
        console.error('Error al actualizar el perfil del invitado:', error);
        this.errorMessage = 'Error al actualizar el perfil del invitado.';
      }
    }
  }

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
}
