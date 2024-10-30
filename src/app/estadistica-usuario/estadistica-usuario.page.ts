import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js';
import { EstudianteService } from '../services/estudiante.service';
import { AuthService } from '../services/auth.service'; // Asegúrate de tener AuthService configurado para obtener el ID del usuario
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-estadistica-usuario',
  templateUrl: './estadistica-usuario.page.html',
  styleUrls: ['./estadistica-usuario.page.scss'],
})
export class EstadisticaUsuarioPage implements OnInit {
  @ViewChild('puntajeChart') puntajeChart!: ElementRef;
  chart: any;
  etiquetas: string[] = [];
  puntajes: number[] = [];

  constructor(private estudianteService: EstudianteService, private authService: AuthService) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    try {
      const estudianteId = await firstValueFrom(this.estudianteService.getUserId());

      if (!estudianteId) {
        console.error('No se encontró el ID del usuario');
        return;
      }

      const historialPuntaje = await firstValueFrom(this.estudianteService.obtenerHistorialPuntajeDesdeFirestore(estudianteId));

      this.etiquetas = historialPuntaje.map(data => data.fecha);
      this.puntajes = historialPuntaje.map(data => data.puntaje);

      // Crear el gráfico
      this.crearGraficoPuntaje();
    } catch (error) {
      console.error('Error al cargar el historial de puntaje:', error);
    }
  }

  crearGraficoPuntaje() {
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.puntajeChart.nativeElement, {
      type: 'bar',
      data: {
        labels: this.etiquetas,
        datasets: [{
          label: 'Puntaje por Fecha',
          data: this.puntajes,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Puntaje' }},
          x: { title: { display: true, text: 'Fecha' }}
        }
      }
    });
  }
}
