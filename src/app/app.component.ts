import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './servicios/auth.service';
import {RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isLoggedIn = false;
  tipoUsuario: string | null = null; // 'paciente' o 'administrador'

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedInEmitter.subscribe((loggedIn: boolean) => {
      this.isLoggedIn = loggedIn;
      
      if (loggedIn) {
        // Obtener el perfil del usuario y determinar el tipo
        this.authService.getUserProfile().then(usuario => {
          this.tipoUsuario = usuario?.tipoUsuario || null;
        });
      } else {
        this.tipoUsuario = null;
      }
    });
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout().then(() => {
      this.isLoggedIn = false;
      this.tipoUsuario = null;
      this.router.navigate(['/home']);
    });
  }
}
