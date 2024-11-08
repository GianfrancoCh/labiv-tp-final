import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'labiv-tp-final';
}


/* 
* Botones de Acceso rápido
- Deben ser botones redondos
- Deben tener la imagen de perfil del usuario
- Deben estar abajo del login, uno al lado del otro, 6 usuarios (3 pacientes, 2 especialistas, 1 admin)

* Registro de usuarios
- Al ingresar a la página solo se deben ver 2 imágenes que 
represente a un paciente o especialista, según esa elección mostrará un formulario correspondiente.
- Estas imágenes deben estar en botones redondos.*/