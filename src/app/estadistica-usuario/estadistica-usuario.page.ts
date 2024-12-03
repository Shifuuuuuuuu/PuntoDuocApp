import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js';
import { EstudianteService } from '../services/estudiante.service';
import { firstValueFrom } from 'rxjs';
import { MenuController } from '@ionic/angular';
import { NotificationService } from '../services/notification.service';
import { MissionsAlertService } from '../services/missions-alert.service';

@Component({
  selector: 'app-estadistica-usuario',
  templateUrl: './estadistica-usuario.page.html',
  styleUrls: ['./estadistica-usuario.page.scss'],
})
export class EstadisticaUsuarioPage implements OnInit {
  @ViewChild('puntajeChart') puntajeChart!: ElementRef;
  @ViewChild('promedioMensualChart') promedioMensualChart!: ElementRef;
  @ViewChild('eventosPorCategoriaChart') eventosPorCategoriaChart!: ElementRef;
  @ViewChild('porcentajeVerificacionChart') porcentajeVerificacionChart!: ElementRef;
  @ViewChild('misionesChart') misionesChart!: ElementRef;

  misionesCompletadas: any[] = [];
  categoriasMisiones: { [categoria: string]: number } = {};
  totalMisionesCompletadas: number = 0;
  puntajeTotalMisiones: number = 0;

  chart: any;
  etiquetas: string[] = [];
  puntajes: number[] = [];
  etiquetasMeses: string[] = [];
  promedioMensual: number[] = [];
  eventosPorCategoria: { [categoria: string]: number } = {};
  totalEventosInscritos: number = 0;
  totalEventosVerificados: number = 0;
  porcentajeVerificacion: number = 0;
  unreadNotificationsCount: number = 0;
  constructor(private estudianteService: EstudianteService
    ,private menu: MenuController
    , private notificationService: NotificationService
  ,private missionsAlertService: MissionsAlertService) {}

  ngOnInit() {
    this.cargarEstadisticas();
    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }
  openMissionsModal() {
    this.missionsAlertService.showMissionsAlert();
  }

  async cargarEstadisticas() {
    try {
      const estudianteId = await firstValueFrom(this.estudianteService.getUserId());

      if (!estudianteId) {
        console.error('No se encontró el ID del usuario');
        return;
      }

      // Historial de puntaje, promedio mensual y eventos asistidos por categoría
      const historialPuntaje = await firstValueFrom(this.estudianteService.obtenerHistorialPuntajeDesdeFirestore(estudianteId));
      this.etiquetas = historialPuntaje.map(data => data.fecha);
      this.puntajes = historialPuntaje.map(data => data.puntaje);

      const puntajesPorMes: { [mes: string]: number[] } = {};
      historialPuntaje.forEach((data) => {
        const mes = data.fecha.slice(3, 10);
        if (!puntajesPorMes[mes]) {
          puntajesPorMes[mes] = [];
        }
        puntajesPorMes[mes].push(data.puntaje);
      });

      this.etiquetasMeses = Object.keys(puntajesPorMes);
      this.promedioMensual = this.etiquetasMeses.map(mes => {
        const puntajes = puntajesPorMes[mes];
        return puntajes.reduce((a, b) => a + b, 0) / puntajes.length;
      });

      const eventos = await this.estudianteService.obtenerEventosAsistidosPorCategoria(estudianteId);
      eventos.forEach(evento => {
        const categoria = evento.categoria || 'Sin Categoría';
        this.eventosPorCategoria[categoria] = (this.eventosPorCategoria[categoria] || 0) + 1;
      });

      this.totalEventosInscritos = eventos.length;
      this.totalEventosVerificados = eventos.filter(evento => evento.verificado).length;
      this.porcentajeVerificacion = this.totalEventosInscritos > 0
        ? (this.totalEventosVerificados / this.totalEventosInscritos) * 100
        : 0;

      // **Cargar estadísticas de misiones completadas**
      const misiones = await this.missionsAlertService.obtenerMisionesCompletadas(estudianteId);
      this.misionesCompletadas = misiones;
      this.totalMisionesCompletadas = misiones.length;
      this.puntajeTotalMisiones = misiones.reduce((acc, mision) => acc + (mision.puntaje || 0), 0);

      misiones.forEach(mision => {
        const categoria = mision.categoria || 'Sin Categoría';
        this.categoriasMisiones[categoria] = (this.categoriasMisiones[categoria] || 0) + 1;
      });

      // Crear los gráficos
      this.crearGraficoPuntaje();
      this.crearGraficoPromedioMensual();
      this.crearGraficoEventosPorCategoria();
      this.crearGraficoPorcentajeVerificacion();
      this.crearGraficoMisionesCompletadas();
    } catch (error) {
      console.error('Error al cargar el historial de puntaje:', error);
    }
  }
  crearGraficoMisionesCompletadas() {
    const categorias = Object.keys(this.categoriasMisiones);
    const valores = Object.values(this.categoriasMisiones);

    new Chart(this.misionesChart.nativeElement, {
      type: 'bar',
      data: {
        labels: categorias,
        datasets: [{
          label: 'Misiones completadas por categoría',
          data: valores,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Cantidad' }},
          x: { title: { display: true, text: 'Categorías' }}
        }
      }
    });
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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Puntaje' }},
          x: { title: { display: true, text: 'Fecha' }}
        }
      }
    });
  }

  crearGraficoPromedioMensual() {
    new Chart(this.promedioMensualChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.etiquetasMeses,
        datasets: [{
          label: 'Promedio Mensual',
          data: this.promedioMensual,
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Promedio de Puntaje' }},
          x: { title: { display: true, text: 'Mes' }}
        }
      }
    });
  }

  crearGraficoEventosPorCategoria() {
    new Chart(this.eventosPorCategoriaChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.eventosPorCategoria),
        datasets: [{
          label: 'Eventos por Categoría',
          data: Object.values(this.eventosPorCategoria),
          backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }

  crearGraficoPorcentajeVerificacion() {
    new Chart(this.porcentajeVerificacionChart.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Acreditados', 'No  Acreditados'],
        datasets: [{
          data: [this.totalEventosVerificados, this.totalEventosInscritos - this.totalEventosVerificados],
          backgroundColor: ['rgba(75, 192, 192, 0.6)','rgba(255, 99, 132, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)','rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }
}

Chart.defaults.font.family = "Helvetica Neue";
Chart.defaults.font.size = 13;
Chart.defaults.color = "#000";