import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-bar-admin',
  templateUrl: './tab-bar-admin.component.html',
  styleUrls: ['./tab-bar-admin.component.scss'],
})
export class TabBarAdminComponent  implements OnInit {
  public appPages = [
    { title: 'Inicio', url: '/folder-gestor-eventos', icon: 'home' },
    { title: 'Historial de eventos', url: '/historial-eventos', icon: 'reader' },
    { title: 'Centro de ayuda', url: '/centro-ayuda', icon: 'help-buoy' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {}
  navigateTo(url: string) {
    this.router.navigate([url]);
  }
}
