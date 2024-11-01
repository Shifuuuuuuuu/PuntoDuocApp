import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecompensaService } from '../services/recompensa-service.service';

import { Recompensa } from '../interface/IRecompensa';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subir-recompensa',
  templateUrl: './subir-recompensa.page.html',
  styleUrls: ['./subir-recompensa.page.scss'],
})
export class SubirRecompensaPage {
  recompensaForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private recompensaService: RecompensaService // Inyecta el servicio
  ) {
    this.recompensaForm = this.fb.group({
      descripcion: ['', Validators.required],

      fecha_creacion: [new Date().toISOString(), Validators.required],

      puntos_requeridos: ['', [Validators.required, Validators.min(1)]],
      
      cantidad: ['', [Validators.required, Validators.min(1)]]

    });
  }

  async onSubmit() {
    if (this.recompensaForm.valid) {
      const recompensaData: Recompensa = {
        descripcion: this.recompensaForm.value.descripcion,
        fecha_creacion: this.recompensaForm.value.fecha_creacion,
        cantidad: this.recompensaForm.value.cantidad,
        puntos_requeridos: this.recompensaForm.value.puntos_requeridos,
      };
  
      try {
        await this.recompensaService.agregarRecompensa(recompensaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Recompensa guardada exitosamente.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['./folder-ventas']);
        });
      } catch (error) {
        console.error('Error al guardar la recompensa:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al guardar la recompensa. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } else {
      console.error('Formulario inválido');
      Swal.fire({
        title: 'Error',
        text: 'Formulario inválido. Por favor, revisa los campos e inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }
}
  
