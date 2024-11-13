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

  constructor(private firestoreService: FirestoreService) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    // Lógica para cargar datos desde Firestore y asignar a las variables
    this.totalVentas = await this.firestoreService.getTotalVentas();
    this.recompensasEntregadas = await this.firestoreService.getRecompensasEntregadas();
    this.recompensasPendientes = await this.firestoreService.getRecompensasPendientes();
    this.topRecompensas = await this.firestoreService.getTopRecompensas();
    this.topEstudiantes = await this.firestoreService.getTopEstudiantes();

    // Lógica para cargar y mostrar el gráfico de actividad de recompensas
    this.loadActividadRecompensasChart();
  }

  loadActividadRecompensasChart() {
    const ctx = document.getElementById('actividadRecompensasChart') as HTMLCanvasElement;
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [], // Fechas
        datasets: [{
          label: 'Recompensas',
          data: [], // Datos de recompensas por día
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


  }
}
