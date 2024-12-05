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
  recompensasConQR: { recompensa: Recompensa; qrCode: string; fechaCaducidad: string }[] = [];
  qrSeleccionado: string | null = null;
  qrCodeImage: string;
  userId: string;
  tipoUsuario: string | null;

  constructor(
    private recompensaService: RecompensaService,
    private estudianteService: EstudianteService
  ) {}

  async ngOnInit() {
    try {
      this.tipoUsuario = localStorage.getItem('tipousuario');
      this.userEmail = localStorage.getItem('currentUserEmail') || '';
      this.userId = localStorage.getItem('id') || '';

      if (!this.userEmail) {
        this.errorMessage = 'No se pudo obtener el correo del usuario.';
        return;
      }

      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);
      if (!this.tienePermisos) {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
        return;
      }

      // Mostrar indicador de carga
      await this.cargarRecompensas();
    } catch (error) {
      console.error('Error al cargar recompensas:', error);
      this.errorMessage = 'Ocurrió un error al cargar las recompensas.';
    }
  }
  // Cargar recompensas disponibles
  async cargarRecompensas() {
    try {
      const todasLasRecompensas = await this.recompensaService.getRecompensasFiltradas();

      // Filtrar recompensas disponibles
      this.recompensas = todasLasRecompensas.filter(r => r.cantidad > 0);

      // Filtrar recompensas con QR
      this.recompensasConQR = todasLasRecompensas
        .filter(r =>
          r.estudiantesReclamaron?.some(e =>
            e.id_estudiante === this.userId &&
            e.qrCode &&
            !e.reclamado &&
            e.estado === 'activo' &&
            !this.isRecompensaCaducada(e)
          )
        )
        .map(r => {
          const reclamacion = r.estudiantesReclamaron!.find(e =>
            e.id_estudiante === this.userId &&
            !e.reclamado &&
            e.qrCode &&
            e.estado === 'activo' &&
            !this.isRecompensaCaducada(e)
          );
          return {
            recompensa: r,
            qrCode: reclamacion?.qrCode || '',
            fechaCaducidad: this.calcularFechaCaducidad(reclamacion?.fechaReclamacion)
          };
        });
    } catch (error) {
      console.error('Error al cargar recompensas filtradas:', error);
      this.errorMessage = 'Error al cargar recompensas.';
    }
  }
  // Calcular fecha de caducidad
  calcularFechaCaducidad(fechaReclamacion: string | undefined): string {
    if (!fechaReclamacion) return 'N/A';
    const fechaReclamacionDate = new Date(fechaReclamacion);
    fechaReclamacionDate.setFullYear(fechaReclamacionDate.getFullYear() + 1);
    return fechaReclamacionDate.toISOString().split('T')[0]; // Retorna solo la fecha en formato YYYY-MM-DD
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

   // Validar si la recompensa ha caducado
   isRecompensaCaducada(reclamacion: { fechaReclamacion?: string }): boolean {
    if (!reclamacion?.fechaReclamacion) return false;

    const fechaReclamacion = new Date(reclamacion.fechaReclamacion);
    const fechaActual = new Date();
    const fechaCaducidad = new Date(fechaReclamacion);
    fechaCaducidad.setFullYear(fechaReclamacion.getFullYear() + 1);

    return fechaActual >= fechaCaducidad;
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
        const recompensa = recompensaDoc?.data(); // Accede a los datos del documento

        if (!recompensa) {
          Swal.fire({
            title: 'Error',
            text: 'No se encontró la recompensa.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          return;
        }

        if (this.estudiante.puntaje < recompensa.puntos_requeridos) {
          Swal.fire({
            title: 'Puntos insuficientes',
            text: 'No tienes suficientes puntos para reclamar esta recompensa.',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
          return;
        }

        await this.generarQR(recompensa);

        const nuevaCantidad = recompensa.cantidad - 1;
        const nuevoPuntaje = this.estudiante.puntaje - recompensa.puntos_requeridos;

        if (this.estudiante.id_estudiante) {
          const estudianteReclamado = {
            id_estudiante: this.estudiante.id_estudiante,
            reclamado: false,
            qrCode: this.qrCodeImage,
            fechaReclamacion: new Date().toISOString(),
            estado: 'activo'
          };

          if (!recompensa.estudiantesReclamaron) {
            recompensa.estudiantesReclamaron = [];
          }

          recompensa.estudiantesReclamaron.push(estudianteReclamado);

          if (recompensa.id_recompensa) {
            await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa, {
              cantidad: nuevaCantidad,
              estudiantesReclamaron: recompensa.estudiantesReclamaron
            });

            await this.estudianteService.updateEstudiantePuntaje(this.estudiante.id_estudiante, nuevoPuntaje);

            Swal.fire({
              title: 'Recompensa reclamada',
              text: 'Recompensa reclamada con éxito. Tu puntaje ha sido descontado.',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            await this.cargarRecompensas();
          }
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
      id_recompensa: recompensa.id_recompensa,
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
    await this.actualizarDatos();
  }

  async cerrarQR() {
    this.ngOnInit();
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
        this.recompensas = await this.recompensaService.getRecompensas();
        this.recompensas = this.recompensas.filter(r =>
          r.cantidad > 0 &&
          (!r.estudiantesReclamaron || !r.estudiantesReclamaron.some(e => e.fechaReclamacion && e.estado && this.isRecompensaCaducada(e)))
        );

        this.recompensasConQR = this.recompensas
          .filter(r => Array.isArray(r.estudiantesReclamaron) &&
            r.estudiantesReclamaron.some(e =>
              e.id_estudiante === this.userId &&
              e.qrCode &&
              !e.reclamado &&
              e.fechaReclamacion &&
              e.estado &&
              !this.isRecompensaCaducada(e)
            )
          )
          .map(r => {
            const reclamacion = r.estudiantesReclamaron?.find(e =>
              e.id_estudiante === this.userId &&
              !e.reclamado &&
              e.fechaReclamacion &&
              e.estado &&
              !this.isRecompensaCaducada(e)
            );

            return {
              recompensa: r,
              qrCode: reclamacion?.qrCode || '',
              fechaCaducidad: this.calcularFechaCaducidad(reclamacion?.fechaReclamacion)
            };
          });

        console.log("Recompensas con QR:", this.recompensasConQR);
      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }
    } else {
      this.errorMessage = 'No se pudo obtener el correo del usuario.';
    }
  }

}
