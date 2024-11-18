import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-mis-turnos-paciente',
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class MisTurnosPacienteComponent implements OnInit {
  turnos: any[] = []; // Lista de turnos del paciente
  filtroEspecialidad: string = '';
  filtroEspecialista: string = '';

  ngOnInit() {
    this.cargarTurnos();
  }

  cargarTurnos() {
    // Aquí va la lógica para cargar los turnos del paciente desde un servicio
    // Ejemplo: this.turnos = servicio.getTurnosDelPaciente();
  }

  filtrarTurnos() {
    // Lógica para filtrar los turnos por especialidad o especialista
    this.turnos = this.turnos.filter(turno => {
      const coincideEspecialidad = this.filtroEspecialidad
        ? turno.especialidad.toLowerCase().includes(this.filtroEspecialidad.toLowerCase())
        : true;
      const coincideEspecialista = this.filtroEspecialista
        ? turno.especialista.toLowerCase().includes(this.filtroEspecialista.toLowerCase())
        : true;
      return coincideEspecialidad && coincideEspecialista;
    });
  }

  cancelarTurno(turno: any) {
    if (turno.estado !== 'realizado') {
      // Lógica para mostrar un modal y obtener el motivo de la cancelación
      console.log('Cancelar turno:', turno);
    }
  }

  verResena(turno: any) {
    if (turno.tieneResena) {
      // Lógica para ver la reseña del turno
      console.log('Ver reseña del turno:', turno);
    }
  }

  completarEncuesta(turno: any) {
    if (turno.estado === 'realizado' && turno.tieneResena) {
      // Lógica para mostrar un formulario de encuesta
      console.log('Completar encuesta del turno:', turno);
    }
  }

  calificarAtencion(turno: any) {
    if (turno.estado === 'realizado') {
      // Lógica para mostrar un formulario de calificación de atención
      console.log('Calificar atención del turno:', turno);
    }
  }
}