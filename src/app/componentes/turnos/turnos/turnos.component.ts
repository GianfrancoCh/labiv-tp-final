import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Turno } from '../../../clases/turno'; 

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  especialidades: string[] = [];
  especialistas: string[] = [];
  filtroEspecialidad: string = '';
  filtroEspecialista: string = '';
  usuario: any;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'administrador') {
      return;
    }
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);

    // Usando la clase Turno para mapear los datos
    this.turnos = snapshot.docs.map(doc => {
      const data = doc.data();
      // Convierte Timestamp a Date usando la clase Turno
      const fecha = (data['fecha'] && data['fecha'].seconds) 
        ? new Date(data['fecha'].seconds * 1000) 
        : new Date();

      return new Turno(
        doc.id,
        fecha,
        data['estado'],
        data['especialidad'],
        data['paciente'],
        data['especialista']
      );
    });

    this.turnosFiltrados = [...this.turnos];

    // Obtener especialidades y especialistas únicos para los filtros
    this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad ?? ''))).filter(Boolean);
    this.especialistas = Array.from(new Set(this.turnos.map(turno => turno.especialista ?? ''))).filter(Boolean);
  }

  aplicarFiltros() {
    this.turnosFiltrados = this.turnos.filter(turno => {
      const coincideEspecialidad = !this.filtroEspecialidad || turno.especialidad === this.filtroEspecialidad;
      const coincideEspecialista = !this.filtroEspecialista || turno.especialista === this.filtroEspecialista;
      return coincideEspecialidad && coincideEspecialista;
    });
  }

  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true
    });

    if (comentario) {
      try {
        const turnoRef = doc(this.firestore, 'turnos', turno.id);
        await updateDoc(turnoRef, { estado: 'cancelado', comentario });
        Swal.fire('Turno cancelado', 'El turno ha sido cancelado exitosamente.', 'success');
        await this.cargarTurnos();
      } catch (error) {
        console.error('Error al cancelar el turno:', error);
        Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
      }
    }
  }
}
