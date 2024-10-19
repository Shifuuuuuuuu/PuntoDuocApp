import { Component } from '@angular/core';
import { Router } from '@angular/router';



@Component({
  selector: 'app-folder-ventas',
  templateUrl: './folder-ventas.page.html',
  styleUrls: ['./folder-ventas.page.scss'],
})
export class FolderVentasPage {
  constructor(private router: Router) {}

  subirRecompensa() {
    this.router.navigate(['/subir-recompensa']);
  }

  verRecompensas() {
    this.router.navigate(['/ver-recompensas']);
  }


}
