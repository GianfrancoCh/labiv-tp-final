import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy } from '@angular/fire/firestore';
import * as XLSX from 'xlsx'; // Importa la biblioteca xlsx

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css'],
})
export class LogsComponent implements OnInit {
  logs: any[] = [];
  loading: boolean = false;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.cargarLogs();
  }

  async cargarLogs() {
    if (this.loading) return;

    this.loading = true;

    try {
      const loginsRef = collection(this.firestore, 'logins');
      const q = query(loginsRef, orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);

      this.logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error al cargar los logs:', error);
    } finally {
      this.loading = false;
    }
  }

  descargarExcel(): void {
    // Crea una hoja de trabajo a partir de los datos de los logs
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.logs);

    // Crea un libro de trabajo
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');

    // Genera el archivo Excel y lo descarga
    XLSX.writeFile(workbook, 'logs.xlsx');
  }
}
