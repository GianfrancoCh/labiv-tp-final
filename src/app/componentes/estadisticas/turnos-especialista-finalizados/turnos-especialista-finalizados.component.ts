import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { Turno } from '../../../clases/turno';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-turnos-especialista-finalizados',
  templateUrl: './turnos-especialista-finalizados.component.html',
  styleUrls: ['./turnos-especialista-finalizados.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class TurnosEspecialistaFinalizadosComponent implements OnInit {
  turnos: Turno[] = []; // Lista completa de turnos
  turnosFiltrados: Turno[] = []; // Turnos filtrados
  especialistas: { id: string; nombre: string }[] = []; // Lista de especialistas
  especialistaSeleccionado: string = ''; // Especialista seleccionado para el filtro
  fechaInicio: Date | null = null; // Fecha inicial del filtro
  fechaFin: Date | null = null; // Fecha final del filtro
  chart: Chart | null = null; // Referencia al gráfico

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  async cargarTurnos(): Promise<void> {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);

    const turnos: Turno[] = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      if (data.fecha && data.fecha.seconds) {
        data.fecha = new Date(data.fecha.seconds * 1000);
      }
      return new Turno(
        doc.id,
        data.fecha,
        data.estado,
        data.especialidad,
        data.paciente,
        data.especialista,
        data.pacienteNombre,
        data.especialistaNombre,
        data.resenaPaciente,
        data.resenaEspecialista,
        data.comentario,
        data.diagnostico
      );
    });

    for (let turno of turnos) {
      if (turno.especialista) {
        const especialistaRef = doc(this.firestore, 'usuarios', turno.especialista);
        const especialistaSnapshot = await getDoc(especialistaRef);
        if (especialistaSnapshot.exists()) {
          turno.especialistaNombre = especialistaSnapshot.data()['nombre'];
        } else {
          turno.especialistaNombre = 'Desconocido';
        }
      }
    }

    this.turnos = turnos;
    this.especialistas = Array.from(
      new Set(
        this.turnos.map((turno) => ({
          id: turno.especialista,
          nombre: turno.especialistaNombre ?? 'Desconocido',
        }))
      )
    );
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (!this.fechaInicio || !this.fechaFin || !this.especialistaSeleccionado) {
      this.turnosFiltrados = [];
      this.renderChart();
      return;
    }
  
    this.turnosFiltrados = this.turnos.filter((turno) => {
      const fechaTurno = turno.fecha;
      if (!fechaTurno) return false;
  
      return (
        turno.estado === 'realizado' &&
        turno.especialista === this.especialistaSeleccionado &&
        this.fechaInicio !== null && // Validación explícita
        this.fechaFin !== null && // Validación explícita
        fechaTurno >= this.fechaInicio &&
        fechaTurno <= this.fechaFin
      );
    });
  
    this.renderChart();
  }

  onFechaInicioChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaInicio = input.valueAsDate;
    this.aplicarFiltro();
  }
  
  onFechaFinChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fechaFin = input.valueAsDate;
    this.aplicarFiltro();
  }


  renderChart(): void {
    const labels = Array.from(
      new Set(this.turnosFiltrados.map((turno) => turno.fecha.toLocaleDateString('es-ES')))
    );
    const valores = labels.map(
      (label) =>
        this.turnosFiltrados.filter(
          (turno) => turno.fecha.toLocaleDateString('es-ES') === label
        ).length
    );

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('graficoTurnosEspecialista') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos Finalizados',
            data: valores,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
