import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-dashboard-vendedor',
  templateUrl: './dashboard-vendedor.page.html',
  styleUrls: ['./dashboard-vendedor.page.scss'],
})
export class DashboardVendedorPage implements OnInit {
  totalVentas: number;
  recompensasEntregadas: number;
  recompensasPendientes: number;
  topRecompensas: any[] = [];
  topEstudiantes: any[] = [];

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    this.loadActividadRecompensasChart();
  }

  async loadDashboardData() {
    try {
      // Cargar datos en paralelo
      const [ventas, entregadas, pendientes, recompensas, estudiantes] = await Promise.all([
        this.firestoreService.getTotalVentas(),
        this.firestoreService.getRecompensasEntregadas(),
        this.firestoreService.getRecompensasPendientes(),
        this.firestoreService.getTopRecompensas(),
        this.firestoreService.getTopEstudiantes(),
      ]);

      // Asignar resultados a las variables
      this.totalVentas = ventas;
      this.recompensasEntregadas = entregadas;
      this.recompensasPendientes = pendientes;
      this.topRecompensas = recompensas;
      this.topEstudiantes = estudiantes;
    } catch (error) {
      console.error('Error al cargar los datos del dashboard:', error);
    }
  }


  loadActividadRecompensasChart() {
    const ctx = document.getElementById('actividadRecompensasChart') as HTMLCanvasElement;
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Enero', 'Febrero', 'Marzo', 'Abril'], // Ejemplo de etiquetas
          datasets: [{
            label: 'Recompensas',
            data: [10, 20, 15, 30], // Datos de ejemplo
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    } else {
      console.error('El elemento del gráfico no se encontró en el DOM.');
    }
  }
}
