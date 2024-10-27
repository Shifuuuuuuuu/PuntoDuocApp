import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecompensaService } from '../services/recompensa-service.service';
import { Recompensa } from '../interface/IRecompensa';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { EstudianteService } from '../services/estudiante.service';
import { EstudianteSinPassword } from '../interface/IEstudiante';
import * as QRCode from 'qrcode';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore'; // Asegúrate de importar Firestore también
import { firstValueFrom } from 'rxjs';




@Component({
  selector: 'app-ver-recompensas',
  templateUrl: './ver-recompensas.component.html',
  styleUrls: ['./ver-recompensas.component.scss'],
})
export class VerRecompensasComponent implements OnInit {
  userEmail: string;
  recompensas: Recompensa[] = [];
  errorMessage: string | undefined;
  tienePermisos: boolean = false;
  estudiante: EstudianteSinPassword | undefined;
  qrCodeImage: string | undefined;

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private firestore: AngularFirestore,
    private estudianteService: EstudianteService
  ) {}

  async ngOnInit() {
    
    this.userEmail = localStorage.getItem('currentUserEmail') || '';
    if (this.userEmail) {
      this.tienePermisos = this.verificarUsuarioVentasOEventos(this.userEmail);
      await this.loadUserData();
    } else {
      this.errorMessage = 'No se pudo obtener el correo del usuario.';
    }
  }

  verificarUsuarioVentasOEventos(email: string): boolean {
    return email.endsWith('@duocuc.cl');
  }

  async loadUserData() {
    if (this.tienePermisos) {
      this.recompensas = await this.recompensaService.getRecompensas();
      
    } else {
      this.errorMessage = 'No tienes permisos para ver las recompensas.';
      return;
    }

    if (this.userEmail) {
      const estudiantes = await this.estudianteService.getEstudianteByEmail(this.userEmail);
      this.estudiante = estudiantes[0];
    }
  }
  async reclamarRecompensa(id_recompensa: string) {
    if (!this.userEmail) {
      alert('Por favor, inicia sesión.');
      return;
    }
    
    // Obtener la recompensa usando el id
    const recompensaDoc = await firstValueFrom(this.recompensaService.getRecompensaById(id_recompensa));
    if (recompensaDoc) {
        const recompensa = recompensaDoc.data() as Recompensa;
        await this.generarQR(recompensa);
        // Crear el objeto del estudiante que reclama la recompensa
        const estudianteReclamado = { id_estudiante: this.userEmail, reclamado: false, qrCode:this.qrCodeImage};

        // Actualizar la cantidad de la recompensa
        const nuevaCantidad = recompensa.cantidad - 1;

        // Actualizar el array de estudiantes que reclamaron
        const estudiantesReclamaronActuales = recompensa.estudiantesReclamaron || [];
        estudiantesReclamaronActuales.push(estudianteReclamado);

        // Generar el QR antes de actualizar
        
        
        // Actualizar la recompensa en Firestore
        if (recompensa.id_recompensa) {
            try {
                await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa, {
                    cantidad: nuevaCantidad,
                    estudiantesReclamaron: estudiantesReclamaronActuales,
                    });

                alert('Recompensa reclamada con éxito.');

                // Mostrar el QR si lo deseas
                // document.getElementById('qrCodeImage').src = this.qrCodeImage;

            } catch (error) {
                console.error('Error al actualizar la recompensa:', error);
                alert('Hubo un error al reclamar la recompensa. Inténtalo de nuevo.');
            }
        }
    } else {
        alert('No se encontró la recompensa.');
    } 
  }
  
  
  async generarQR(recompensa: Recompensa) {
    if (!this.estudiante) return;
    const qrData = JSON.stringify({
      id_estudiante: this.estudiante.id_estudiante,
      recompensa: recompensa.descripcion,
      puntos: recompensa.puntos_requeridos
    });
    this.qrCodeImage = await QRCode.toDataURL(qrData);
  }
  async reclamar(recompensa: Recompensa) {
    if (this.estudiante) {
      await this.reclamarRecompensa(recompensa.id_recompensa!);
      this.recompensas = await this.recompensaService.getRecompensas();
    }
  }
}
