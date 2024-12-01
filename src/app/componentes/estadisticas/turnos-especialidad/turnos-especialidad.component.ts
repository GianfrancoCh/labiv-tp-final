import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Title } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Title);

@Component({
  selector: 'app-turnos-especialidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos-especialidad.component.html',
  styleUrls: ['./turnos-especialidad.component.css']
})
export class TurnosEspecialidadComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor(private firestore: Firestore) {}

  async ngOnInit(): Promise<void> {
    const especialidadesData = await this.cargarTurnosPorEspecialidad();
    this.crearGrafico(especialidadesData);
  }

  async cargarTurnosPorEspecialidad(): Promise<Record<string, number>> {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);

    const especialidadConteo: Record<string, number> = {};
    snapshot.docs.forEach(doc => {
      const especialidad = doc.data()['especialidad'];
      if (especialidad) {
        especialidadConteo[especialidad] = (especialidadConteo[especialidad] || 0) + 1;
      }
    });

    return especialidadConteo;
  }

  crearGrafico(data: Record<string, number>): void {
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (this.chart) {
      this.chart.destroy(); // Destruir el gráfico anterior si existe
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Turnos por Especialidad',
            data: values,
            backgroundColor: '#4c5baf',
            borderColor: '#34568b',
            borderWidth: 1,
            hoverBackgroundColor: '#274b72',
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true
          },
          title: {
            display: true,
            text: 'Distribución de Turnos por Especialidad',
            font: {
              size: 18
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Especialidades'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Turnos'
            }
          }
        }
      }
    });
  }
}
