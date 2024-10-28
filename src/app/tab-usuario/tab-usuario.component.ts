import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-usuario',
  templateUrl: './tab-usuario.component.html',
  styleUrls: ['./tab-usuario.component.scss'],
})
export class TabUsuarioComponent  implements OnInit {
  public appPages = [
    { title: 'Inicio', url: '/folder/Inicio', icon: 'home' },
    { title: 'Perfil', url: '/perfil-usuario', icon: 'person-circle' },
    { title: 'Recompensa', url: '/ver-recompensas', icon: 'cash' },
    { title: 'Estadistica', url: '/estadistica-usuario', icon: 'bar-chart' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  navigateTo(url: string) {
    this.router.navigate([url]);
  }


}
