import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import moment from 'moment';

@Component({
  selector: 'app-turnos-dia',
  templateUrl: './turnos-dia.component.html',
  styleUrls: ['./turnos-dia.component.css'],
  standalone: true,
})
export class TurnosDiaComponent implements OnInit {
  turnos: { fecha: string }[] = []; // Lista completa de turnos
  turnosPorDia: Record<string, number> = {}; // Mapa de turnos por día
  fechaInicio: Date | null = null; // Fecha inicial del filtro
  fechaFin: Date | null = null; // Fecha final del filtro
  chart: Chart | null = null; // Referencia al gráfico

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const snapshot = await getDocs(turnosRef);
  
      this.turnos = snapshot.docs.map((doc) => {
        const turnoData = doc.data();
        const fechaTimestamp = turnoData['fecha']; // Este es el objeto Timestamp
  
        // Verifica si fecha es un Timestamp y conviértelo a Date
        const fecha = fechaTimestamp?.toDate ? fechaTimestamp.toDate() : null;
  
  
        return { fecha: fecha ? fecha.toISOString().split('T')[0] : 'Fecha inválida' };
      });

      this.calcularTurnosPorDia(this.turnos);
      this.renderChart();
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
    }
  }

  parsearFecha(fechaString: string): string | null {
    try {
      const fecha = moment(fechaString, 'D [de] MMMM [de] YYYY, h:mm:ss A');
      return fecha.isValid() ? fecha.format('YYYY-MM-DD') : null;
    } catch (error) {
      console.error('Error al parsear la fecha:', fechaString, error);
      return null;
    }
  }

  calcularTurnosPorDia(turnos: { fecha: string }[]) {
    this.turnosPorDia = {}; // Reiniciamos los datos
  
    turnos.forEach((turno) => {
      const fecha = turno.fecha; // Ya está en formato legible
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
      // Si no hay filtro, mostramos todos los datos
      this.calcularTurnosPorDia(this.turnos);
    } else {
      // Aplicamos el filtro por rango de fechas
      const turnosFiltrados = this.turnos.filter((turno) => {
        const fechaTurno = new Date(turno.fecha);
        return (
          fechaTurno >= this.fechaInicio! &&
          fechaTurno <= this.fechaFin!
        );
      });

      this.calcularTurnosPorDia(turnosFiltrados);
    }

    this.renderChart();
  }

  renderChart() {
    const labels = Object.keys(this.turnosPorDia);
    const values = Object.values(this.turnosPorDia);
  
  
    if (this.chart) {
      this.chart.destroy(); // Destruimos el gráfico anterior
    }
  
    const ctx = document.getElementById('turnosDiaChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por Día',
            data: values,
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
