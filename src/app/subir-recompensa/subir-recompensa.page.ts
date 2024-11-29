import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecompensaService } from '../services/recompensa-service.service';

import { Recompensa } from '../interface/IRecompensa';
import Swal from 'sweetalert2';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-subir-recompensa',
  templateUrl: './subir-recompensa.page.html',
  styleUrls: ['./subir-recompensa.page.scss'],
})
export class SubirRecompensaPage {
  recompensaForm: FormGroup;
  imagePreview: string | null = null; // Vista previa de la imagen
  imageBase64: string | null = null; // Imagen convertida a Base64

  constructor(
    private fb: FormBuilder,
    private recompensaService: RecompensaService
  ) {
    this.recompensaForm = this.fb.group({
      descripcion: ['', Validators.required],
      fecha_creacion: [new Date().toISOString(), Validators.required],
      puntos_requeridos: ['', [Validators.required, Validators.min(1)]],
      cantidad: ['', [Validators.required, Validators.min(1)]],
    });
  }

  // Método para manejar el cambio de imagen
  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageBase64 = reader.result as string;
        this.imagePreview = this.imageBase64;
      };
      reader.readAsDataURL(file); // Convierte la imagen a Base64
    }
  }

  async onSubmit() {
    if (this.recompensaForm.valid) {
      const recompensaData: Recompensa = {
        descripcion: this.recompensaForm.value.descripcion,
        fecha_creacion: this.recompensaForm.value.fecha_creacion,
        cantidad: this.recompensaForm.value.cantidad,
        puntos_requeridos: this.recompensaForm.value.puntos_requeridos,
        imagen: this.imageBase64 || undefined, // Incluye la imagen en Base64
      };

      try {
        await this.recompensaService.agregarRecompensa(recompensaData);
        Swal.fire({
          title: 'Éxito',
          text: 'Recompensa guardada exitosamente.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      } catch (error) {
        console.error('Error al guardar la recompensa:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al guardar la recompensa. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Formulario inválido. Por favor, revisa los campos.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  }
}


