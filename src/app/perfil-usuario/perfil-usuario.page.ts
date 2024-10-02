import { Component, OnInit } from '@angular/core';
<<<<<<< Updated upstream
=======
import { Estudiante } from '../interface/IEstudiante';
import { Invitado } from '../interface/IInvitado'; 
import { AuthService } from '../services/auth.service';
import { InvitadoService } from '../services/invitado.service'; 
import { Router } from '@angular/router';
import * as QRCode from 'qrcode';
>>>>>>> Stashed changes

@Component({
  selector: 'app-perfil-usuario',
  templateUrl: './perfil-usuario.page.html',
  styleUrls: ['./perfil-usuario.page.scss'],
})
export class PerfilUsuarioPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
