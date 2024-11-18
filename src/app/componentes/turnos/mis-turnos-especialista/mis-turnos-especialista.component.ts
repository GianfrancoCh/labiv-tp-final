import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mis-turnos-especialista',
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.css']
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: any[] = []; // Lista de turnos del especialista
  filtro: string = ''; // Filtro de búsqueda

  ngOnInit() {
    // Cargar los turnos del especialista desde el servicio
    this.cargarTurnos();
  }

  cargarTurnos() {
    // Lógica para cargar los turnos del especialista
  }

  cancelarTurno(turno: any) {
    if (turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'rechazado') {
      // Mostrar modal para ingresar el motivo de la cancelación
    }
  }

  rechazarTurno(turno: any) {
    if (turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'cancelado') {
      // Mostrar modal para ingresar el motivo del rechazo
    }
  }

  aceptarTurno(turno: any) {
    if (turno.estado !== 'realizado' && turno.estado !== 'cancelado' && turno.estado !== 'rechazado') {
      // Cambiar el estado del turno a "aceptado"
    }
  }

  finalizarTurno(turno: any) {
    if (turno.estado === 'aceptado') {
      // Mostrar formulario para ingresar el diagnóstico y finalizar el turno
    }
  }

  filtrarTurnos() {
    // Lógica para filtrar los turnos por Especialidad o Paciente
  }
}
