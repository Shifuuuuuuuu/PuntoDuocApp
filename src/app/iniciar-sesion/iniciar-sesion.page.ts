import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.page.html',
  styleUrls: ['./iniciar-sesion.page.scss'],
})
export class IniciarSesionPage implements OnInit {
  rememberMe: boolean = false;
  constructor() { }
  login() {
    if (this.rememberMe) {
      // Guardar credenciales de usuario
      console.log("Guardando las credenciales para futuras sesiones");
    } else {
      console.log("Iniciar sesión sin recordar credenciales");
    }
  }
  ngOnInit() {
  }

}
