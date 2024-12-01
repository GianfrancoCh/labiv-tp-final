import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-turnos-especialista',
  templateUrl: './turnos-especialista.component.html',
  styleUrls: ['./turnos-especialista.component.css'],
  standalone: true,
})
export class TurnosEspecialistaComponent implements OnInit {
  turnos: any[] = [];
  turnosPorEspecialista: Record<string, number> = {};
  especialistas: Record<string, string> = {}; // Mapea IDs a nombres
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;
  chart: Chart | null = null;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);
  
    this.turnos = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const turno = docSnap.data();
        const fecha = turno['fecha']?.toDate() || null;
  
        // Resolver el nombre del especialista
        const especialistaId = turno['especialista']; // Actualizado con corchetes
        let especialistaNombre = 'Desconocido';
        if (especialistaId) {
          if (!this.especialistas[especialistaId]) {
            const especialistaRef = doc(this.firestore, 'usuarios', especialistaId);
            const especialistaSnap = await getDoc(especialistaRef);
            especialistaNombre =
              especialistaSnap.exists() && especialistaSnap.data()['nombre']
                ? especialistaSnap.data()['nombre']
                : 'Desconocido';
            this.especialistas[especialistaId] = especialistaNombre;
          } else {
            especialistaNombre = this.especialistas[especialistaId];
          }
        }
  
        return {
          ...turno,
          fecha,
          especialistaNombre,
        };
      })
    );
  
    this.calcularTurnosPorEspecialista(this.turnos);
    this.renderChart();
  }
  

  calcularTurnosPorEspecialista(turnos: any[]) {
    this.turnosPorEspecialista = {}; // Reiniciamos los datos

    turnos.forEach((turno) => {
      const fechaTurno = turno.fecha;
      if (
        (!this.fechaInicio || fechaTurno >= this.fechaInicio) &&
        (!this.fechaFin || fechaTurno <= this.fechaFin)
      ) {
        const especialista = turno.especialistaNombre;
        this.turnosPorEspecialista[especialista] =
          (this.turnosPorEspecialista[especialista] || 0) + 1;
      }
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
    this.calcularTurnosPorEspecialista(this.turnos);
    this.renderChart();
  }

  renderChart() {
    const labels = Object.keys(this.turnosPorEspecialista);
    const values = Object.values(this.turnosPorEspecialista);

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = document.getElementById('turnosEspecialistaChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por Especialista',
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
