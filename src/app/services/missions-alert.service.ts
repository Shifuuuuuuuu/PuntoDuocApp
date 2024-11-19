import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class MissionsAlertService {
// Datos de las misiones
private missions = [
  { title: 'Misión 1', description: 'Completa un evento.', progress: 1, points: 100 },
  { title: 'Misión 2', description: 'Asiste a 3 talleres.', progress: 0.3, points: 500 },
  { title: 'Misión 3', description: 'Responde una encuesta.', progress: 1, points: 100 }
];

constructor(private authService: AuthService) {}

async showMissionsAlert() {
  const isStudent = await this.checkIfUserIsStudent();
  if (!isStudent) {
    Swal.fire('Acceso restringido', 'Solo los estudiantes pueden ver las misiones.', 'info');
    return;
  }

  const missionHtml = this.missions.map(mission => `
    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h4 style="margin: 0 0 8px;">${mission.title}</h4>
      <p style="margin: 0 0 10px; font-size: 14px; color: #666;">${mission.description}</p>
      <progress value="${mission.progress}" max="1" style="width: 100%; height: 10px; margin-bottom: 10px; border-radius: 5px;"></progress>
      <button
        style="
          display: block;
          width: 100%;
          padding: 10px;
          background-color: ${mission.progress < 1 ? '#d3d3d3' : '#007bff'};
          color: ${mission.progress < 1 ? '#999' : '#fff'};
          border: none;
          border-radius: 5px;
          cursor: ${mission.progress < 1 ? 'not-allowed' : 'pointer'};
          font-size: 14px;
          text-transform: uppercase;
        "
        ${mission.progress < 1 ? 'disabled' : ''}
        onclick="Swal.fire('Puntaje reclamado', 'Has ganado ${mission.points} puntos!', 'success')">
        Reclamar ${mission.points} puntos
      </button>
    </div>
  `).join('');

  Swal.fire({
    title: 'Misiones',
    html: missionHtml,
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: 'missions-popup'
    }
  });
}

private async checkIfUserIsStudent(): Promise<boolean> {
  const userEmail = await this.authService.getCurrentUserEmail().toPromise();
  if (userEmail) {
    const student = await this.authService.getEstudianteByEmail(userEmail);
    return !!student; // Devuelve true si es estudiante, false si no lo es
  }
  return false;
}
}
