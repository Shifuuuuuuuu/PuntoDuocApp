import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecompensaService } from '../services/recompensa-service.service';
import { Recompensa } from '../interface/IRecompensa';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { EstudianteService } from '../services/estudiante.service';
import { EstudianteSinPassword } from '../interface/IEstudiante';
import * as QRCode from 'qrcode';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-ver-recompensas',
  templateUrl: './ver-recompensas.page.html',
  styleUrls: ['./ver-recompensas.page.scss'],
})
export class VerRecompensasPage implements OnInit {
  userEmail: string | undefined;
  recompensas: Recompensa[] = [];
  errorMessage: string | undefined;
  tienePermisos: boolean = false;
  estudiante: EstudianteSinPassword | undefined;
  qrData: string = ''; 
  qrCodeImage: string | undefined;
  recompensaSeleccionada: any;

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private router: Router,
    private firestore: AngularFirestore,
    private estudianteService: EstudianteService,
    private alertController: AlertController
  ) {}

  async loadUserData() {
    try {
      this.tienePermisos = await this.verificarUsuarioVentasOEventos(this.userEmail);

      if (this.tienePermisos) {
        // Cargar las recompensas si el usuario tiene permisos
        this.recompensas = await this.recompensaService.getRecompensas();
      } else {
        this.errorMessage = 'No tienes permisos para ver las recompensas.';
      }

      if (this.userEmail) {
        const estudiantes = await this.estudianteService.getEstudianteByEmail(this.userEmail);
        this.estudiante = estudiantes[0];
      }
    } catch (error) {
      this.errorMessage = 'Error al cargar los datos del usuario.';
      console.error(this.errorMessage, error);
    }
  }

  verificarUsuarioVentasOEventos(email: string | undefined): Promise<boolean> {
    return new Promise((resolve) => {
      const isValidEmail = email ? email.endsWith('@duocuc.cl') : false;
      resolve(isValidEmail);
    });
  }

  async getRecompensas(): Promise<void> {
    try {
      const snapshot = await this.firestore.collection<Recompensa>('Recompensas').get().toPromise();
      if (!snapshot || snapshot.empty) {
        console.warn('No se encontraron recompensas');
        return;
      }
      this.recompensas = snapshot.docs.map(doc => {
        const data = doc.data() as Recompensa;
        return { id_recompensa: doc.id, ...data };
      });
    } catch (error) {
      console.error('Error al obtener las recompensas:', error);
    }
  }

  async reclamar(recompensa: Recompensa) {
    if (this.estudiante) {
      try {
        await this.recompensaService.reclamarRecompensa(recompensa.id_recompensa!, this.estudiante);
        this.loadRecompensas();
      } catch (error) {
        console.error('Error al reclamar recompensa:', error);
      }
    }
  }
  async loadRecompensas() {
    try {
      this.recompensas = await this.recompensaService.getRecompensas();
    } catch (error) {
      console.error('Error al cargar recompensas:', error);
    }
  }

  ngOnInit() {
    this.authService.getCurrentUserEmail().subscribe(email => {
      if (email) {
        this.userEmail = email;
        this.loadUserData();
      } else {
        this.errorMessage = 'Error: currentUserEmail no está definido.';
        console.error(this.errorMessage);
        this.router.navigate(['/iniciar-sesion']);
      }
    });
  }

  hasReclamado(recompensa: any): boolean {
    if (!this.estudiante || !recompensa.estudiantesReclamaron) {
      return false; // Si no hay estudiante o no hay registros de reclamaciones
    }
  
    // Verificar si el estudiante ha reclamado la recompensa
    return recompensa.estudiantesReclamaron.some((e: any) => 
      e.id_estudiante === this.estudiante!.id_estudiante && !e.reclamado
    );
  }
  
  generateQrData(recompensa: any) {
    const qrDataObject = {
      qrData: JSON.stringify({
        userId: this.estudiante?.id_estudiante || '',
        recompensaId: recompensa.id || '',
        descripcion: recompensa.descripcion || '',
        puntosRequeridos: recompensa.puntos_requeridos || 0,
        fecha: new Date().toISOString()
      }),
      userId: this.estudiante?.id_estudiante || '',
      recompensaId: recompensa.id || '',
      descripcion: recompensa.descripcion || '',
    };

    this.qrData = qrDataObject.qrData;
  }

  async generarQR(recompensa: any) {
    try {
      if (!this.estudiante) {
        throw new Error('No hay estudiante disponible para generar QR.');
      }

      // Guardar la recompensa seleccionada
      this.recompensaSeleccionada = recompensa;

      // Generar los datos del QR basados en la recompensa y el estudiante
      const qrDataObject = {
        id_estudiante: this.estudiante.id_estudiante,
        recompensa: recompensa.descripcion,
        puntos: recompensa.puntos_requeridos
      };

      // Convertir el objeto en una cadena JSON
      const qrData = JSON.stringify(qrDataObject);

      // Generar el QR Code en formato Data URL
      this.qrCodeImage = await QRCode.toDataURL(qrData);

    } catch (error) {
      console.error('Error al generar el código QR:', error);
    }
  }
}
