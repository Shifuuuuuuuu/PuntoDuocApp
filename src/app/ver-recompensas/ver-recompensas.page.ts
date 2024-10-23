import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RecompensaService } from '../services/recompensa-service.service';
import { Recompensa } from '../interface/IRecompensa';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { EstudianteService } from '../services/estudiante.service';
import { EstudianteSinPassword } from '../interface/IEstudiante';

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

  constructor(
    private authService: AuthService,
    private recompensaService: RecompensaService,
    private router: Router,
    private firestore: AngularFirestore,
    private estudianteService: EstudianteService
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

  async reclamarRecompensa(id_recompensa: string, puntos_requeridos: number): Promise<void> {
    if (this.estudiante && this.estudiante.id_estudiante) {
      const recompensaRef = this.firestore.collection('Recompensas').doc(id_recompensa).ref;
      const estudianteRef = this.firestore.collection('Estudiantes').doc(this.estudiante.id_estudiante).ref;

      const recompensaSnap = await recompensaRef.get();
      const estudianteSnap = await estudianteRef.get();

      if (recompensaSnap.exists && estudianteSnap.exists) {
        const recompensa = recompensaSnap.data() as Recompensa;
        const estudiante = estudianteSnap.data() as EstudianteSinPassword;

        if (estudiante.puntaje >= puntos_requeridos && recompensa.cantidad > 0) {
          await estudianteRef.update({
            puntaje: estudiante.puntaje - puntos_requeridos
          });

          await recompensaRef.update({
            cantidad: recompensa.cantidad - 1
          });

          const gestorRecompensaRef = this.firestore.collection('GestorRecompensa');
          await gestorRecompensaRef.add({
            id_estudiante: this.estudiante.id_estudiante,
            id_recompensa: id_recompensa,
            fecha_reclamacion: new Date().toISOString()
          });

          console.log(`Recompensa ${id_recompensa} reclamada con éxito por el estudiante ${this.estudiante.id_estudiante}.`);
        } else {
          console.error('Puntos insuficientes o recompensa agotada.');
        }
      } else {
        console.error('Estudiante o recompensa no encontrados.');
      }
    } else {
      console.error('Datos del estudiante no disponibles.');
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
}
