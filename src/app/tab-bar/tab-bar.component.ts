import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VentasAuthService } from '../services/ventas.service';


@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent  implements OnInit {
  constructor(private router: Router,private ventas:VentasAuthService) { }

  ngOnInit() {}
  inicio() {
    this.router.navigate(['../folder-ventas']);
  }
  subirRecompensa() {
    this.router.navigate(['../subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['../ver-recompensas']);
  }
  logout() {
    this.ventas.logout();  // Llamamos al método logout del servicio
    this.router.navigate(['/iniciar-sesion']);  // Redirige al usuario a la página de login
  }
}
