import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecompensaService } from '../services/recompensa-service.service';
import { Recompensa } from '../interface/IRecompensa';
import { EstudianteService } from '../services/estudiante.service';
import { EstudianteSinPassword } from '../interface/IEstudiante';
import * as QRCode from 'qrcode';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ver-recompensas',
  templateUrl: './ver-recompensas.component.html',
  styleUrls: ['./ver-recompensas.component.scss'],
})
export class VerRecompensasComponent implements OnInit {
  userEmail: string = '';
  recompensas: Recompensa[] = [];
  errorMessage: string | undefined;
  tienePermisos: boolean = false;
  estudiante: EstudianteSinPassword | undefined;
  recompensasConQR: { recompensa: Recompensa; qrCode: string }[] = [];
  qrSeleccionado: string | null = null;
  qrCodeImage: string;

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private estudianteService: EstudianteService
  ) {}

  async ngOnInit() {
    this.userEmail = localStorage.getItem('currentUserEmail') || '';
  
    if (this.userEmail) {
      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);
      await this.loadUserData();
  
      if (this.tienePermisos) {
        // Obtener todas las recompensas sin filtros
        this.recompensas = await this.recompensaService.getRecompensas();
  
        // Filtrar las recompensas que tienen un QR ya generado para este usuario
        this.recompensasConQR = this.recompensas
          .filter(r => Array.isArray(r.estudiantesReclamaron) && 
            r.estudiantesReclamaron.some(e => e.id_estudiante === this.userEmail && e.qrCode)
          )
          .map(r => ({
            recompensa: r,
            qrCode: r.estudiantesReclamaron?.find(e => e.id_estudiante === this.userEmail)?.qrCode || ''
          }));
  
        console.log("Todas las recompensas:", this.recompensas);
        console.log("Recompensas con QR:", this.recompensasConQR);
  
      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }
    } else {
      this.errorMessage = 'No se pudo obtener el correo del usuario.';
    }
  }
  
  

  verificarUsuarioVentasOEventos(email: string): boolean {
    return email.endsWith('@duocuc.cl');
  }

  async loadUserData() {
    try {
      this.recompensas = await this.recompensaService.getRecompensas();
      const estudiantes = await this.estudianteService.getEstudianteByEmail(this.userEmail);
      this.estudiante = estudiantes[0];
    } catch (error) {
      this.errorMessage = 'Error al cargar datos del usuario.';
    }
  }

  filtrarRecompensasConQR() {
    this.recompensasConQR = this.recompensas
      .filter(r => r.estudiantesReclamaron?.some(e => e.id_estudiante === this.userEmail && e.qrCode))
      .map(r => ({
        recompensa: r,
        qrCode: r.estudiantesReclamaron!.find(e => e.id_estudiante === this.userEmail)?.qrCode || ''
      }));
  }

  async reclamarRecompensa(id_recompensa: string | undefined) {
    if (!this.userEmail || !this.estudiante) {
      alert('Por favor, inicia sesión.');
      return;
    }
   
    
    try {
      const recompensaDoc = await firstValueFrom(this.recompensaService.getRecompensaById(id_recompensa));
      if (recompensaDoc) {
          const recompensa = recompensaDoc.data() as Recompensa;
  
          await this.generarQR(recompensa);
  
          let nuevaCantidad: number; // Declare it here
  
          if (this.estudiante.id_estudiante) {
              const estudianteReclamado = {
                  id_estudiante: this.estudiante.id_estudiante, // Now guaranteed to be a string
                  reclamado: false,
                  qrCode: this.qrCodeImage // Make sure this is a string or provide a fallback
              };
  
              nuevaCantidad = recompensa.cantidad - 1; // Assign value here
              recompensa.estudiantesReclamaron?.push(estudianteReclamado);
          } else {
              console.error('ID del estudiante es undefined');
              return; // Exit early if id_estudiante is undefined
          }
  
          if (recompensa.id_recompensa) {
              await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa, {
                  cantidad: nuevaCantidad,
                  estudiantesReclamaron: recompensa.estudiantesReclamaron
              });
              alert('Recompensa reclamada con éxito.');
              this.loadUserData();  // Recargar datos
          }
      } else {
          alert('No se encontró la recompensa.');
      }
  } catch (error) {
      console.error('Error al reclamar la recompensa:', error);
      alert('Hubo un error al reclamar la recompensa.');
  }
}
  async generarQR(recompensa: Recompensa) {
    if (!this.estudiante) return;

    const qrDataObject = {
      id_estudiante: this.estudiante.id_estudiante,
      recompensa: recompensa.descripcion,
      puntos: recompensa.puntos_requeridos
    };

    this.qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrDataObject));
  }

  async verQRConSweetAlert(qrCode: string) {
    await Swal.fire({
      title: 'Código QR',
      html: `<img src="${qrCode}" alt="Código QR" style="width: 100%; max-width: 300px; margin-top: 20px;">`,
      showCloseButton: true,
      showConfirmButton: false,
      width: 400,
      padding: '3em',
      background: '#fff',
      backdrop: `
        rgba(0,0,0,0.4)
        left top
        no-repeat
      `
    });
  }
  cerrarQR() {
    this.qrSeleccionado = null;
  }

  async reclamar(recompensa: Recompensa) {
    if (this.estudiante) {
      await this.reclamarRecompensa(recompensa.id_recompensa!);
      this.recompensas = await this.recompensaService.getRecompensas();
    }
  }
}
