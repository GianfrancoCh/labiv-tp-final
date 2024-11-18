import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Usuario } from '../../clases/usuario';
import { CommonModule } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';
import { MisHorariosComponent } from '../turnos/mis-horarios/mis-horarios.component'; // Importa el componente

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css'],
  imports: [CommonModule, ReactiveFormsModule, MisHorariosComponent] // Asegúrate de importar MisHorariosComponent
})
export class MiPerfilComponent implements OnInit {
  usuario: Usuario | null = null;

  constructor(private authService: AuthService, private fb: FormBuilder, private firestore: Firestore) {}

  async ngOnInit(): Promise<void> {
    try {
      // Obtener el perfil del usuario
      this.usuario = await this.authService.getUserProfile();
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
    }
  }
}
