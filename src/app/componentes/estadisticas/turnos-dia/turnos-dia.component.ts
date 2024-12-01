import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
} from 'chart.js';
import moment from 'moment';

@Component({
  selector: 'app-turnos-dia',
  templateUrl: './turnos-dia.component.html',
  styleUrls: ['./turnos-dia.component.css'],
  standalone: true,
})
export class TurnosDiaComponent implements OnInit {
  turnos: { fecha: string }[] = [];
  turnosPorDia: Record<string, number> = {};
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  chart: Chart | null = null;

  constructor(private firestore: Firestore) {
    // Registra los componentes de Chart.js necesarios
    Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);
  }

  ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const snapshot = await getDocs(turnosRef);

      this.turnos = snapshot.docs.map((doc) => {
        const turnoData = doc.data();
        const fechaTimestamp = turnoData['fecha'];
        const fecha = fechaTimestamp?.toDate ? fechaTimestamp.toDate() : null;

        return { fecha: fecha ? fecha.toISOString().split('T')[0] : 'Fecha inválida' };
      });

      this.calcularTurnosPorDia(this.turnos);
      this.renderChart();
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  calcularTurnosPorDia(turnos: { fecha: string }[]) {
    this.turnosPorDia = {};

    turnos.forEach((turno) => {
      const fecha = turno.fecha;
      this.turnosPorDia[fecha] = (this.turnosPorDia[fecha] || 0) + 1;
    });
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

  aplicarFiltro() {
    if (!this.fechaInicio || !this.fechaFin) {
      this.calcularTurnosPorDia(this.turnos);
    } else {
      const turnosFiltrados = this.turnos.filter((turno) => {
        const fechaTurno = new Date(turno.fecha);
        return fechaTurno >= this.fechaInicio! && fechaTurno <= this.fechaFin!;
      });

      this.calcularTurnosPorDia(turnosFiltrados);
    }

    this.renderChart();
  }

  renderChart() {
    const labels = Object.keys(this.turnosPorDia);
    const values = Object.values(this.turnosPorDia);

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('turnosDiaChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por Día',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Fecha',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Turnos',
            },
          },
        },
      },
    });
  }
}
