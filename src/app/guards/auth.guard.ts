import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Asegúrate de ajustar el path si es necesario

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.getCurrentUserEmailSync()) {
      return true;
    } else {
      this.router.navigate(['/iniciar-sesion']);
      return false;
    }
  }
}
