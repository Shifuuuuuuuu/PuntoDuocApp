import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-ver-recompensas-page',
  templateUrl: './ver-recompensas.page.html',
  styleUrls: ['./ver-recompensas.page.scss'],
})
export class VerRecompensasPage implements OnInit  {
  unreadNotificationsCount: number = 0;
  constructor(
  private menu: MenuController,
  private notificationService: NotificationService
  ) {}
  ionViewWillEnter() {
    this.menu.enable(false);  // Deshabilita el menú en esta página
  }
  ngOnInit() {
    // Suscríbete al observable para actualizar el contador de notificaciones en la interfaz
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

}
