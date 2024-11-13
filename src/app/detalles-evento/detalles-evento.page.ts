import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CapacitorBarcodeScanner } from '@capacitor/barcode-scanner';
import { CartService } from '../services/cart.service';
import { MenuController } from '@ionic/angular';
import { Evento } from '../interface/IEventos';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { EstudianteService } from '../services/estudiante.service';
Chart.register(...registerables, ChartDataLabels);
@Component({
  selector: 'app-detalles-evento',
  templateUrl: './detalles-evento.page.html',
  styleUrls: ['./detalles-evento.page.scss'],
})
export class DetallesEventoPage implements OnInit {
  @ViewChild('pieChart') pieChart: ElementRef;
  chart: any;
  eventoId: string = '';
  mensajePresencia: string = '';
  esVerificado: boolean = false;
  escaneando: boolean = false;
  usuariosVerificados: any[] = [];
  usuariosNoVerificados: any[] = [];
  listaEspera: any[] = [];
  mostrarListas = false;
  mostrarListaEspera = false;
  mostrarDashboard = false;
  evento: Evento | undefined;

  constructor(
    private route: ActivatedRoute,
    private cartService: CartService,
    private menu: MenuController,
    private estudianteService: EstudianteService
  ) {}

  ionViewWillEnter() {
    this.menu.enable(false);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventoId = id;
        this.cargarEvento();
        this.cargarListas();
      } else {
        console.error('No se encontró el ID del evento.');
      }
    });
  }

  async cargarEvento() {
    try {
      this.evento = await this.cartService.getEvento(this.eventoId);
    } catch (error) {
      console.error('Error al cargar el evento:', error);
    }
  }

  async cargarListas() {
    try {
      const { inscripciones, listaEspera } = await this.cartService.getDatosEvento(this.eventoId);
      this.usuariosVerificados = inscripciones.filter(user => user.verificado);
      this.usuariosNoVerificados = inscripciones.filter(user => !user.verificado);
      this.listaEspera = listaEspera;
      if (this.mostrarDashboard) {
        this.createPieChart(); // Crear el gráfico solo si mostrarDashboard es true
      }
    } catch (error) {
      console.error('Error al cargar las listas:', error);
    }
  }

  async verificarInscripcion() {
    this.escaneando = true;
    try {
        const qrData = await this.startScan();
        console.log('Datos del QR escaneado:', qrData);

        if (qrData) {
          // Obtener la inscripción para el evento
          const inscripcion = await this.cartService.getInscripcionVerificada(qrData, this.eventoId);

          // Verificar si la inscripción existe y ya ha sido verificada
          if (inscripcion && inscripcion.verificado === true) {
              console.log('El usuario ya ha sido verificado previamente.');
              this.mensajePresencia = 'Este usuario ya ha sido acreditado.';
              await this.presentSweetAlertAcreditacion(qrData.nombreCompleto, this.evento?.titulo || 'Evento', 0, 'yaAcreditado');
              return; // Salir de la función si el usuario ya estaba acreditado
          }

          // Proceder con la verificación y actualización si el usuario no estaba verificado
          const result = await this.cartService.verifyAndUpdateInscription(qrData, this.eventoId);
          this.esVerificado = result.verificado;

          if (this.esVerificado) {
              const esInvitado = qrData.tipoUsuario === 'invitado';
              const estado = esInvitado ? 'acreditadoInvitado' : 'acreditado';

              this.mensajePresencia = 'Inscripción verificada con éxito.';
              await this.presentSweetAlertAcreditacion(qrData.nombreCompleto, this.evento?.titulo || 'Evento', result.puntaje || 0, estado);
              this.cargarListas(); // Actualiza las listas después de la acreditación
          } else {
              this.mensajePresencia = 'No se encontró inscripción.';
              await this.presentSweetAlertAcreditacion(qrData.nombreCompleto, this.evento?.titulo || 'Evento', 0, 'noInscrito');
          }
      }
    } catch (error) {
        this.mensajePresencia = 'Error al verificar inscripción. Intenta de nuevo.';
        this.esVerificado = false;
        console.error('Error durante la verificación de inscripción:', error);
    } finally {
        this.escaneando = false;
    }
}



  async startScan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: 17,
        cameraDirection: 1,
      });

      const qrData = result.ScanResult;
      const parsedData = JSON.parse(qrData);

      // Ajusta la validación para que busque `userId`
      if (parsedData.userId && parsedData.nombreCompleto) {
        return parsedData; // Retorna los datos escaneados si son válidos
      } else {
        throw new Error('Los datos del QR no son válidos');
      }
    } catch (e) {
      console.error('Error al escanear el código:', e);
      throw e;
    }
  }
  createPieChart() {
    if (this.chart) {
      this.chart.destroy(); // Destruir el gráfico anterior si existe para evitar superposición
    }

    const verificados = this.usuariosVerificados.length;
    const noVerificados = this.usuariosNoVerificados.length;
    const total = verificados + noVerificados;

    this.chart = new Chart(this.pieChart.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Acreditados', 'No Acreditados'],
        datasets: [
          {
            data: [verificados, noVerificados],
            backgroundColor: ['#4CAF50', '#FF5252'], // Verde para verificados, rojo para no verificados
            hoverBackgroundColor: ['#66BB6A', '#FF867C'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          datalabels: {
            color: '#black', // Color del texto en el gráfico
            formatter: (value, context) => {
              const percentage = ((value / total) * 100).toFixed(1) + '%'; // Cálculo del porcentaje
              return percentage; // Muestra el porcentaje en cada sección
            },
            font: {
              weight: 'bold',
            },
          },
        },
      },
      plugins: [ChartDataLabels], // Activar el plugin de etiquetas
    });
  }
  toggleDashboard() {
    this.mostrarDashboard = !this.mostrarDashboard;
    if (this.mostrarDashboard) {
      this.cargarListas(); // Cargar datos y mostrar el gráfico si mostrarDashboard es true
    }
  }
  toggleListas() {
    this.mostrarListas = !this.mostrarListas; // Alterna la visibilidad de las listas
    if (this.mostrarListas) {
      this.cargarListas(); // Cargar las listas solo si se van a mostrar
    }
  }
  toggleListaEspera() {
    this.mostrarListaEspera = !this.mostrarListaEspera; // Alterna la visibilidad de la lista de espera
    if (this.mostrarListaEspera && this.listaEspera.length === 0) {
      this.cargarListas(); // Cargar la lista de espera solo si aún no ha sido cargada
    }
  }
  async presentSweetAlertAcreditacion(nombreUsuario: string, nombreEvento: string, puntaje: number, estado: 'yaAcreditado' | 'acreditado' | 'acreditadoInvitado' | 'noInscrito') {
    let title = '';
    let text = '';
    let icon: 'success' | 'error' | 'info' = 'info';

    if (estado === 'yaAcreditado') {
        title = 'Ya Acreditado';
        text = `${nombreUsuario} ya está acreditado para el evento ${nombreEvento}.`;
        icon = 'info';
    } else if (estado === 'acreditado') {
        title = 'Acreditación Exitosa';
        text = `${nombreUsuario} ha sido acreditado para el evento ${nombreEvento}. Tu puntaje total es de  ${puntaje}.`;
        icon = 'success';
    } else if (estado === 'acreditadoInvitado') {
        title = 'Acreditación Exitosa';
        text = `${nombreUsuario} ha sido acreditado para el evento ${nombreEvento}.`;
        icon = 'success';
    } else {
        title = 'No Inscrito';
        text = `${nombreUsuario} no está inscrito en el evento ${nombreEvento}.`;
        icon = 'error';
    }

    await Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonText: 'OK'
    });

    // Recargar la página al confirmar el mensaje
    this.cargarListas();
}

}
