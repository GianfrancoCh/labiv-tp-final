import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy } from '@angular/fire/firestore';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css'],
})
export class EstadisticasComponent implements OnInit {
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
      const q = query(loginsRef, orderBy('fecha', 'desc')); // Sin límites
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
}
