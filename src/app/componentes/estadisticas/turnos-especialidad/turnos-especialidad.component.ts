import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Title } from 'chart.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        this.chart.destroy();
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
                    text: 'Turnos por Especialidad',
                    font: {
                        size: 18
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Especialidades',
                        font: {
                            size: 16 // Tamaño del texto del título de la escala X
                        }
                    },
                    ticks: {
                        font: {
                            size: 14 // Tamaño del texto de las etiquetas de la escala X
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad de Turnos',
                        font: {
                            size: 16 // Tamaño del texto del título de la escala Y
                        }
                    },
                    ticks: {
                        font: {
                            size: 14 // Tamaño del texto de las etiquetas de la escala Y
                        }
                    }
                }
            }
        }
    });
  }

  descargarPDF(): void {
    const doc = new jsPDF();

    // Título del PDF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Estadísticas: Turnos por Especialidad', 10, 10);

    // Tabla de datos
    const labels = this.chart?.data.labels as string[];
    const values = this.chart?.data.datasets[0].data as number[];

    autoTable(doc, {
      startY: 20,
      head: [['Especialidad', 'Cantidad']],
      body: labels.map((label, index) => [label, values[index].toString()]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [76, 175, 80], textColor: 255 },
      bodyStyles: { textColor: 50 },
    });

    const lastPosition = (doc as any).lastAutoTable.finalY || 30;

    // Agregar gráfico como imagen
    const canvas = this.chartCanvas.nativeElement;
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 10, lastPosition + 10, 180, 90);

    // Descargar el PDF
    doc.save('turnos-especialidad.pdf');
  }
}
