import { Component, OnInit } from '@angular/core';
import { Invitado } from '../interface/IInvitado';
import { Router } from '@angular/router';
import { InvitadoService } from '../services/invitado.service';

@Component({
  selector: 'app-registrar-invitado',
  templateUrl: './registrar-invitado.page.html',
  styleUrls: ['./registrar-invitado.page.scss'],
})
export class RegistrarInvitadoPage implements OnInit {

  invitado: Invitado = {
    id_Invitado: '',
    password: '',
    email: '',
    Nombre_completo: '',
    Rut: '',
    Telefono: ''
  };

  errorMessage: string = '';

  constructor(private invitadoService: InvitadoService, private router: Router) { }

  registrarInvitado() {
    this.errorMessage = '';  // Resetear el mensaje de error
    this.invitadoService.verificarInvitadoPorCorreo(this.invitado.email)
      .then(yaRegistrado => {
        if (yaRegistrado) {
          this.errorMessage = 'El correo electrónico ya está registrado.';
        } else {
          // Si no está registrado, proceder a registrarlo
          this.invitadoService.registrarInvitado(this.invitado).then(() => {
            console.log('Invitado registrado correctamente');
            this.router.navigate(['/iniciar-sesion']);
          }).catch(error => {
            console.error('Error al registrar invitado:', error);
            this.errorMessage = 'Ocurrió un error al registrar el invitado.';
          });
        }
      });
  }

  ngOnInit() {
  }

}
