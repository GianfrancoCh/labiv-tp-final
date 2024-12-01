import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { LogsComponent } from './logs/logs.component';
import { TurnosEspecialidadComponent } from './turnos-especialidad/turnos-especialidad.component';
import { TurnosDiaComponent } from './turnos-dia/turnos-dia.component';
import { TurnosEspecialistaComponent } from './turnos-especialista/turnos-especialista.component';
import { TurnosEspecialistaFinalizadosComponent } from './turnos-especialista-finalizados/turnos-especialista-finalizados.component';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [
    CommonModule,
    LogsComponent,
    TurnosEspecialidadComponent,
    TurnosDiaComponent,
    TurnosEspecialistaComponent,
    TurnosEspecialistaFinalizadosComponent,
  ],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css'],
})
export class EstadisticasComponent implements OnInit {
  logs: any[] = [];
  loading: boolean = false;

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    // Aquí puedes cargar datos iniciales si lo necesitas
  }
  
}
