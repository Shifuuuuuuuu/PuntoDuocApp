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

      console.log('Tipo de usuario:', this.tipoUsuario);
      console.log('Email del usuario:', this.userEmail);
      console.log('ID del usuario:', this.userId);

      if (!this.userEmail) {
        this.errorMessage = 'No se pudo obtener el correo del usuario.';
        console.log('Error: No se encontró el correo del usuario en localStorage.');
        return;
      }

      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);
      console.log('Tiene permisos:', this.tienePermisos);

      if (!this.tienePermisos) {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
        console.log('Error: El usuario no tiene permisos para acceder a recompensas.');
        return;
      }

      // Cargar datos del usuario
      await this.loadUserData();

      if (!this.estudiante) {
        console.log('Estudiante no encontrado. Intentando recargar.');
        const estudiante = await this.estudianteService.getEstudianteByEmail(this.userEmail);
        if (estudiante) {
          this.estudiante = estudiante;
          console.log('Estudiante recargado con éxito:', estudiante);
        } else {
          console.log('Error: No se pudo cargar el estudiante desde el servicio.');
        }
      }

      await this.cargarRecompensas();
    } catch (error) {
      console.error('Error al inicializar componente:', error);
      this.errorMessage = 'Ocurrió un error al inicializar la vista de recompensas.';
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
      console.log('Cargando datos del usuario...');
      const estudiante = await this.estudianteService.getEstudianteByEmail(this.userEmail);
      if (estudiante) {
        this.estudiante = estudiante;
        console.log('Estudiante cargado con éxito:', estudiante);
      } else {
        console.log('Error: No se encontró el estudiante con el correo especificado.');
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
      console.log('Usuario confirmado para reclamar recompensa.');
      console.log('Email del usuario:', this.userEmail);
      console.log('Estudiante actual:', this.estudiante);

      if (!this.userEmail || !this.estudiante) {
        console.log('Error: El usuario no está autenticado o no se encontró un estudiante válido.');
        Swal.fire({
          title: 'Error',
          text: 'Por favor, inicia sesión.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      try {
        console.log('Obteniendo recompensa con ID:', id_recompensa);
        const recompensaDoc = await firstValueFrom(this.recompensaService.getRecompensaById(id_recompensa));
        const recompensa = recompensaDoc?.data();
        console.log('Recompensa obtenida:', recompensa);

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
          console.log('Error: Puntos insuficientes para reclamar la recompensa.');
          Swal.fire({
            title: 'Puntos insuficientes',
            text: 'No tienes suficientes puntos para reclamar esta recompensa.',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
          return;
        }

        console.log('Generando QR para la recompensa.');
        await this.generarQR(recompensa);

        const nuevaCantidad = recompensa.cantidad - 1;
        const nuevoPuntaje = this.estudiante.puntaje - recompensa.puntos_requeridos;

        console.log('Actualizando recompensa y puntaje del estudiante.');
        console.log('Nueva cantidad de la recompensa:', nuevaCantidad);
        console.log('Nuevo puntaje del estudiante:', nuevoPuntaje);

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

            console.log('Recompensa y puntaje actualizados correctamente.');
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
