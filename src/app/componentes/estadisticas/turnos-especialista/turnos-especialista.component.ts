import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Chart } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-turnos-especialista',
  templateUrl: './turnos-especialista.component.html',
  styleUrls: ['./turnos-especialista.component.css'],
  standalone: true,
})
export class TurnosEspecialistaComponent implements OnInit {
  @ViewChild('turnosEspecialistaChartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  turnos: any[] = [];
  turnosPorEspecialista: Record<string, number> = {};
  especialistas: Record<string, string> = {};
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

        const especialistaId = turno['especialista'];
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

    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    this.turnosPorEspecialista = {};

    const turnosFiltrados = this.turnos.filter((turno) => {
      const fechaTurno = turno.fecha;
      return (
        (!this.fechaInicio || fechaTurno >= this.fechaInicio) &&
        (!this.fechaFin || fechaTurno <= this.fechaFin)
      );
    });

    turnosFiltrados.forEach((turno) => {
      const especialista = turno.especialistaNombre;
      this.turnosPorEspecialista[especialista] =
        (this.turnosPorEspecialista[especialista] || 0) + 1;
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

  renderChart() {
    const labels = Object.keys(this.turnosPorEspecialista);
    const values = Object.values(this.turnosPorEspecialista);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos por Especialista',
            data: values,
            backgroundColor: '#4c5baf',
            borderColor: '#34568b',
            borderWidth: 1,
            hoverBackgroundColor: '#274b72',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: 'Turnos por Especialista',
            font: {
              size: 20,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Especialistas',
              font: {
                size: 16,
              },
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Turnos',
              font: {
                size: 16,
              },
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  }

  descargarPDF(): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    // Título del PDF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Estadísticas: Turnos por Especialista', 10, 30);

    // Tabla de datos
    const labels = this.chart?.data.labels as string[];
    const values = this.chart?.data.datasets[0].data as number[];

    autoTable(doc, {
      startY: 50,
      head: [['Especialista', 'Cantidad']],
      body: labels.map((label, index) => [label, values[index].toString()]),
      styles: { fontSize: 12 },
      headStyles: { fillColor: [76, 175, 80], textColor: 255 },
      bodyStyles: { textColor: 50 },
    });

    const lastPosition = (doc as any).lastAutoTable.finalY || 70;

    // Gráfico
    const canvas = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 15, lastPosition + 10, 500, 250);

    doc.save('turnos-especialista.pdf');
  }
}
