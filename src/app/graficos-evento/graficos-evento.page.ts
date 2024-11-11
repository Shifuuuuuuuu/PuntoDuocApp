import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart } from 'chart.js';
import { CartService } from '../services/cart.service';
import { Evento } from '../interface/IEventos';
import { EstudianteService } from '../services/estudiante.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
@Component({
  selector: 'app-graficos-evento',
  templateUrl: './graficos-evento.page.html',
  styleUrls: ['./graficos-evento.page.scss'],
})
export class GraficosEventoPage implements OnInit {
  @ViewChild('pieChart', { static: false }) pieChart: ElementRef;
  @ViewChild('barChart', { static: false }) barChart: ElementRef;
  @ViewChild('carreraPieChart', { static: false }) carreraPieChart: ElementRef;
  chartPie: any;
  chartBar: any;
  chartCarreraPie: any;
  eventoId: string = '';
  inscritos: number = 0;
  verificados: number = 0;
  noVerificados: number = 0;
  estudiantesConCarrera: number = 0;
  invitadosSinCarrera: number = 0;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventoId = id;
        this.cargarDatosEvento();
      } else {
        console.error('No se encontró el ID del evento.');
      }
    });
  }

  async ngAfterViewInit() {
    await this.cargarDatosEvento();
    if (this.pieChart && this.pieChart.nativeElement) {
      this.createPieChart();
    }
    if (this.barChart && this.barChart.nativeElement) {
      this.createBarChart();
    }
    if (this.carreraPieChart && this.carreraPieChart.nativeElement) {
      this.createCarreraPieChart();
    }
  }

  async cargarDatosEvento() {
    try {
      const evento: Evento | undefined = await this.cartService.getEvento(this.eventoId);
      if (evento) {
        this.inscritos = evento.inscritos || 0;

        if (evento.Inscripciones && Array.isArray(evento.Inscripciones)) {
          this.verificados = evento.Inscripciones.filter(inscripcion => inscripcion.verificado === true).length;
          this.noVerificados = this.inscritos - this.verificados;

          for (const inscripcion of evento.Inscripciones) {
            if (inscripcion.carrera) {
              this.estudiantesConCarrera++;
            } else {
              this.invitadosSinCarrera++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar los datos del evento:', error);
      throw error;
    }
  }

  createPieChart() {
    if (this.chartPie) {
      this.chartPie.destroy();
    }

    if (this.pieChart && this.pieChart.nativeElement) {
      const total = this.verificados + this.noVerificados;
      this.chartPie = new Chart(this.pieChart.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Acreditados', 'No Acreditados'],
          datasets: [
            {
              data: [this.verificados, this.noVerificados],
              backgroundColor: ['#4CAF50', '#FF5252'],
              hoverBackgroundColor: ['#66BB6A', '#FF867C'],
            }
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            datalabels: {
              formatter: (value, context) => {
                const percentage = ((value / total) * 100).toFixed(1) + '%';
                return percentage;
              },
              color: '#000',
              font: {
                weight: 'bold',
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }

  createBarChart() {
    if (this.chartBar) {
      this.chartBar.destroy();
    }

    if (this.barChart && this.barChart.nativeElement) {
      this.chartBar = new Chart(this.barChart.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Inscritos', 'Acreditados', 'No Acreditados'],
          datasets: [
            {
              label: 'Participación en el Evento',
              data: [this.inscritos, this.verificados, this.noVerificados],
              backgroundColor: ['#00A1E0', '#4CAF50', '#FF5252'],
              borderColor: ['#007BB5', '#388E3C', '#D32F2F'],
              borderWidth: 1,
            }
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Número de Participantes'
              }
            }
          },
          plugins: {
            datalabels: {
              anchor: 'end',
              align: 'top',
              formatter: (value) => {
                return value;
              },
              color: '#000',
              font: {
                weight: 'bold',
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }

  createCarreraPieChart() {
    if (this.chartCarreraPie) {
      this.chartCarreraPie.destroy();
    }

    if (this.carreraPieChart && this.carreraPieChart.nativeElement) {
      const totalCarreras = this.estudiantesConCarrera + this.invitadosSinCarrera;
      this.chartCarreraPie = new Chart(this.carreraPieChart.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Estudiantes', 'Invitados'],
          datasets: [
            {
              data: [this.estudiantesConCarrera, this.invitadosSinCarrera],
              backgroundColor: ['#42A5F5', '#FFCA28'],
              hoverBackgroundColor: ['#64B5F6', '#FFD54F'],
            }
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            datalabels: {
              formatter: (value, context) => {
                const percentage = ((value / totalCarreras) * 100).toFixed(1) + '%';
                return percentage;
              },
              color: '#000',
              font: {
                weight: 'bold',
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }
}
