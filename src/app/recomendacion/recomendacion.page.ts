import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Share } from '@capacitor/share';
import { EstudianteService } from '../services/estudiante.service';
@Component({
  selector: 'app-recomendacion',
  templateUrl: './recomendacion.page.html',
  styleUrls: ['./recomendacion.page.scss'],
})
export class RecomendacionPage implements OnInit {

  constructor(private estudianteService: EstudianteService) {}

  async recomendarPorWhatsapp() {
    const mensaje = `¡Hola! Descarga ya la app PuntoDuoc para que puedas estar al tanto de los eventos, participa y recibirás puntajes para que después puedas canjear por productos exclusivos de Duoc UC. ¡Nos vemos en los eventos!`;
    const urlApp = 'https://tuapp.com'; // Cambia esto por la URL de tu app
    const mensajeCompleto = `${mensaje} ${urlApp}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeCompleto)}`;

    try {
      window.open(whatsappUrl, '_blank');
      // Otorgar los puntos al estudiante que recomienda
      this.otorgarPuntosRecomendacion();
    } catch (error) {
      console.error('Error al compartir en WhatsApp:', error);
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un problema al compartir en WhatsApp.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  async otorgarPuntosRecomendacion() {
    try {
      const userId = await this.estudianteService.getUserId().toPromise();
      if (userId) {
        await this.estudianteService.actualizarPuntajeEstudiante(userId, 500);
        Swal.fire({
          title: '¡Éxito!',
          text: 'Has ganado 500 puntos por recomendar la app.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo obtener tu usuario para otorgar los puntos.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un problema al otorgar los puntos de recomendación.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      console.error('Error al otorgar puntos de recomendación:', error);
    }
  }

  ngOnInit() {}

}
