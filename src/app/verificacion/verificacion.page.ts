import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { EstudianteService } from '../services/estudiante.service';
import { InvitadoService } from '../services/invitado.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-verificacion',
  templateUrl: './verificacion.page.html',
  styleUrls: ['./verificacion.page.scss'],
})
export class VerificacionPage implements OnInit {
  mode: string | null = null;
  oobCode: string | null = null;
  email: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private afAuth: AngularFireAuth,
    private router: Router,
    private estudianteService: EstudianteService,
    private invitadoService: InvitadoService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mode = params['mode'];
      this.oobCode = params['oobCode'];

      if (this.mode === 'verifyEmail' && this.oobCode) {
        this.verificarCorreo();
      }
    });
  }

  async verificarCorreo() {
    try {
      // Confirmar el correo electrónico usando Firebase Auth
      await this.afAuth.applyActionCode(this.oobCode!);
      Swal.fire('Éxito', 'Tu correo ha sido verificado correctamente.', 'success');

      // Actualizar el estado de verificación en Firestore
      const user = await this.afAuth.currentUser;
      if (user && user.email) {
        const estudiante = await this.estudianteService.obtenerEstudiantePorEmail(user.email);
        const invitado = await this.invitadoService.obtenerInvitadoPorEmail(user.email);

        if (estudiante) {
          await this.estudianteService.verificarEstudiante(user.email);
        } else if (invitado) {
          await this.invitadoService.verificarInvitado(user.email);
        }
      }

      this.router.navigate(['/iniciar-sesion']);
    } catch (error) {
      console.error('Error al verificar el correo:', error);
      Swal.fire('Error', 'No se pudo verificar tu correo. Intenta nuevamente.', 'error');
    }
  }
}
