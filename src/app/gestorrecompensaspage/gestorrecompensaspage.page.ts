import { Component, OnInit } from '@angular/core';
import { Recompensa } from '../interface/IRecompensa';
import { RecompensaService } from '../services/recompensa-service.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-gestorrecompensaspage',
  templateUrl: './gestorrecompensaspage.page.html',
  styleUrls: ['./gestorrecompensaspage.page.scss'],
})
export class GestorrecompensaspagePage implements OnInit {
  recompensas: Recompensa[] = [];
  isLoading = true;

  constructor(
    private recompensaService: RecompensaService,
    private loadingController: LoadingController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarRecompensas();
  }

  async cargarRecompensas() {
    try {
      this.isLoading = true;
      this.recompensas = await this.recompensaService.getRecompensas();
    } catch (error) {
      console.error('Error al cargar recompensas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async editarRecompensa(recompensa: Recompensa) {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Recompensa',
      html: `
        <input id="descripcion" class="swal2-input" placeholder="Descripción" value="${recompensa.descripcion}">
        <input id="cantidad" type="number" class="swal2-input" placeholder="Cantidad disponible" value="${recompensa.cantidad}">
        <input id="puntos" type="number" class="swal2-input" placeholder="Puntos requeridos" value="${recompensa.puntos_requeridos}">
        <input id="imagen" type="file" class="swal2-file">
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const descripcion = (document.getElementById('descripcion') as HTMLInputElement).value;
        const cantidad = +(document.getElementById('cantidad') as HTMLInputElement).value;
        const puntos_requeridos = +(document.getElementById('puntos') as HTMLInputElement).value;
        const imagenFile = (document.getElementById('imagen') as HTMLInputElement).files![0];

        return { descripcion, cantidad, puntos_requeridos, imagenFile };
      },
    });

    if (formValues) {
      const loading = await this.loadingController.create({
        message: 'Actualizando recompensa...',
      });
      await loading.present();

      try {
        let imagenUrl = recompensa.imagen;
        if (formValues.imagenFile) {
          const reader = new FileReader();
          reader.onload = async (event: any) => {
            imagenUrl = event.target.result;
            await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa!, {
              descripcion: formValues.descripcion,
              cantidad: formValues.cantidad,
              puntos_requeridos: formValues.puntos_requeridos,
              imagen: imagenUrl,
            });
            await this.cargarRecompensas();
            loading.dismiss();
          };
          reader.readAsDataURL(formValues.imagenFile);
        } else {
          await this.recompensaService.actualizarRecompensa(recompensa.id_recompensa!, {
            descripcion: formValues.descripcion,
            cantidad: formValues.cantidad,
            puntos_requeridos: formValues.puntos_requeridos,
            imagen: imagenUrl,
          });
          await this.cargarRecompensas();
        }
      } catch (error) {
        console.error('Error al actualizar recompensa:', error);
      } finally {
        loading.dismiss();
      }
    }
  }

  async eliminarRecompensa(id: string) {
    const result = await Swal.fire({
      title: 'Confirmar eliminación',
      text: '¿Estás seguro de que deseas eliminar esta recompensa?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      const loading = await this.loadingController.create({
        message: 'Eliminando recompensa...',
      });
      await loading.present();

      try {
        await this.recompensaService.actualizarRecompensa(id, {});
        await this.cargarRecompensas();
        Swal.fire('Eliminada', 'La recompensa fue eliminada con éxito.', 'success');
      } catch (error) {
        console.error('Error al eliminar recompensa:', error);
      } finally {
        loading.dismiss();
      }
    }
  }
}
