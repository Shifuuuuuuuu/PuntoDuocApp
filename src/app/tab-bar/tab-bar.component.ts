import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent  implements OnInit {
  constructor(private router: Router) { }

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
}
