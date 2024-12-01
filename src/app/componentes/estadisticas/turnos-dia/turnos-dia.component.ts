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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  async descargarPDF(): Promise<void> {
    const doc = new jsPDF();
  
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Estadísticas de Turnos por Día', 10, 10);
  
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 10, 20);
  
    // Agrega una tabla con los turnos por día
    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Cantidad']],
      body: Object.entries(this.turnosPorDia).map(([fecha, cantidad]) => [
        fecha,
        cantidad.toString(),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [76, 175, 80], textColor: 255 },
      bodyStyles: { textColor: 50 },
    });
  
    const lastPosition = (doc as any).lastAutoTable.finalY || 30;
  
    // Captura el gráfico del canvas
    const canvas = document.getElementById('turnosDiaChart') as HTMLCanvasElement;
  
    if (canvas) {
      const imgData = canvas.toDataURL('image/png'); // Convierte el canvas a una imagen base64
      doc.addImage(imgData, 'PNG', 10, lastPosition + 10, 180, 90); // Agrega la imagen al PDF
    } else {
      console.error('El gráfico no se encontró.');
      doc.text('El gráfico no se pudo incluir en el reporte.', 10, lastPosition + 20);
    }
  
    // Agrega una nota al final
    doc.text('Clinica Online by Gianfranco Chiarizia', 10, lastPosition + 110);
  
    // Descarga el PDF
    doc.save('estadisticas_turnos_por_dia.pdf');
  }
}