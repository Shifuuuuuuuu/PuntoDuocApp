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
  userId: string;
  tipoUsuario: string | null;

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private estudianteService: EstudianteService
  ) {}
  async ngOnInit() {
    this.tipoUsuario = localStorage.getItem('tipousuario');
    this.userEmail = localStorage.getItem('currentUserEmail') || '';
    this.userId = localStorage.getItem('id') || '';

    if (this.userEmail) {
      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);
      await this.loadUserData();

      if (this.tienePermisos) {
        // Obtener todas las recompensas sin filtros
        const todasLasRecompensas = await this.recompensaService.getRecompensas();

        // Filtrar las recompensas que tienen cantidad mayor a 0 para la vista general
        this.recompensas = todasLasRecompensas.filter(r => r.cantidad > 0);

        // Filtrar las recompensas que tienen un QR ya generado para este usuario y que no están reclamadas
        this.recompensasConQR = todasLasRecompensas
          .filter(r => Array.isArray(r.estudiantesReclamaron) &&
            r.estudiantesReclamaron.some(e => e.id_estudiante === this.userId && e.qrCode && !e.reclamado)
          )
          .map(r => ({
            recompensa: r,
            qrCode: r.estudiantesReclamaron?.find(e => e.id_estudiante === this.userId && !e.reclamado)?.qrCode || ''
        }));


      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }
    } else {
      this.errorMessage = 'No se pudo obtener el correo del usuario.';
    }
  }




  esEstudiante(): boolean {
    return this.tipoUsuario === 'estudiante';
  }

  verificarUsuarioVentasOEventos(email: string): boolean {
    return email.endsWith('@duocuc.cl');
  }

  async loadUserData() {
    try {
      this.recompensas = await this.recompensaService.getRecompensas();
      const estudiante = await this.estudianteService.getEstudianteByEmail(this.userEmail);
      if (estudiante) {
        this.estudiante = estudiante;
      } else {
        this.errorMessage = 'No se encontró el estudiante con el correo especificado.';
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
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
    const confirmResult = await Swal.fire({
      title: 'Confirmación',
      text: '¿Estás seguro de que quieres reclamar esta recompensa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reclamar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmResult.isConfirmed) {
      if (!this.userEmail || !this.estudiante) {
        Swal.fire({
          title: 'Error',
          text: 'Por favor, inicia sesión.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      try {
        const recompensaDoc = await firstValueFrom(this.recompensaService.getRecompensaById(id_recompensa));
        if (recompensaDoc) {
          const recompensa = { ...recompensaDoc.data() } as Recompensa; // Clonación del objeto

          await this.generarQR(recompensa);

          let nuevaCantidad: number;
          let nuevoPuntaje: number;

          if (this.estudiante.id_estudiante) {
            const estudianteReclamado = {
              id_estudiante: this.estudiante.id_estudiante,
              reclamado: false,
              qrCode: this.qrCodeImage
            };

            nuevaCantidad = recompensa.cantidad - 1; // Asignación de la nueva cantidad

            if (!recompensa.estudiantesReclamaron) {
              recompensa.estudiantesReclamaron = []; // Inicializa como arreglo vacío si no existe
            }
            if (!recompensa.id_recompensa) {
              recompensa.id_recompensa = id_recompensa; // Inicializa como arreglo vacío si no existe
            }

            recompensa.estudiantesReclamaron.push(estudianteReclamado);

          } else {
            console.error('ID del estudiante es undefined');
            return;
          }

          if (recompensa.id_recompensa) {
            try {
              await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa, {
                cantidad: nuevaCantidad,
                estudiantesReclamaron: recompensa.estudiantesReclamaron
              });
              Swal.fire({
                title: 'Recompensa reclamada',
                text: 'Recompensa reclamada con éxito.',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              await this.actualizarDatos();
            } catch (error) {
              console.log(error);
              Swal.fire({
                title: 'Error',
                text: 'Hubo un error al actualizar la recompensa. Por favor, inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'OK'
              });
            }
          }
        } else {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró la recompensa.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error al reclamar la recompensa:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al reclamar la recompensa. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  }


  async generarQR(recompensa: Recompensa) {
    if (!this.estudiante) return;
    const qrDataObject = {
      id_estudiante: this.estudiante.id_estudiante,
      id_recompensa: recompensa.id_recompensa,  // Agrega el id_recompensa aquí
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
    await this.actualizarDatos(); // Reiniciar el método ngOnInit al cerrar el modal
  }
  async cerrarQR() {
    this.ngOnInit(); // Reiniciar el método ngOnInit
    this.qrSeleccionado = null;
    await this.actualizarDatos();
  }

  async reclamar(recompensa: Recompensa) {
    if (this.estudiante) {

      await this.reclamarRecompensa(recompensa.id_recompensa!);
      this.recompensas = await this.recompensaService.getRecompensas();
    }
  }
  async actualizarDatos() {
    this.tipoUsuario = localStorage.getItem('tipousuario');
    this.userEmail = localStorage.getItem('currentUserEmail') || '';
    this.userId = localStorage.getItem('id') || '';

    if (this.userEmail) {
      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);

      if (this.tienePermisos) {
        // Obtener todas las recompensas sin filtros
        this.recompensas = await this.recompensaService.getRecompensas();

        // Filtrar las recompensas que tienen cantidad > 0
        this.recompensas = this.recompensas.filter(r => r.cantidad > 0);

        // Filtrar las recompensas que tienen un QR ya generado para este usuario
        this.recompensasConQR = this.recompensas
          .filter(r => Array.isArray(r.estudiantesReclamaron) &&
            r.estudiantesReclamaron.some(e => e.id_estudiante === this.userId && e.qrCode && !e.reclamado)
          )
          .map(r => ({
            recompensa: r,
            qrCode: r.estudiantesReclamaron?.find(e => e.id_estudiante === this.userId)?.qrCode || ''
          }));

        console.log("Recompensas con QR:", this.recompensasConQR);
      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }
    } else {
      this.errorMessage = 'No se pudo obtener el correo del usuario.';
    }
  }

}
