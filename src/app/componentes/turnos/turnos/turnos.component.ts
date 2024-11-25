import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc,getDoc, query, where } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Turno } from '../../../clases/turno'; 

@Component({
  selector: 'app-turnos',
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class TurnosComponent implements OnInit {
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  especialidades: string[] = [];
  especialistas: string[] = [];
  filtro: string = '';
  usuario: any;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'administrador') {
      return;
    }
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const snapshot = await getDocs(turnosRef);

    // Usando la clase Turno para mapear los datos
    const turnos: Turno[] = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      if (data.fecha && data.fecha.seconds) {
        data.fecha = new Date(data.fecha.seconds * 1000);
      }
      return new Turno(
        doc.id,
        data.fecha,
        data.estado,
        data.especialidad,
        data.paciente,
        data.especialista
      );
    });

    for (let turno of turnos) {
      // Obtener nombre del especialista
      if (turno.especialista) {
        const especialistaRef = doc(this.firestore, 'usuarios', turno.especialista);
        const especialistaSnapshot = await getDoc(especialistaRef);
        if (especialistaSnapshot.exists()) {
          turno.especialistaNombre = especialistaSnapshot.data()['nombre'];
        } else {
          turno.especialistaNombre = 'Desconocido';
        }
      }

      if (turno.paciente) {
        const pacienteRef = doc(this.firestore, 'usuarios', turno.paciente);
        const pacienteSnapshot = await getDoc(pacienteRef);
        if (pacienteSnapshot.exists()) {
          turno.pacienteNombre = pacienteSnapshot.data()['nombre'];
        } else {
          turno.pacienteNombre = 'Desconocido';
        }
      }
    }

    this.turnos = turnos;
    this.turnosFiltrados = [...this.turnos];

    // Obtener especialidades y especialistas únicos para los filtros
    this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad ?? ''))).filter(Boolean);
    this.especialistas = Array.from(new Set(this.turnos.map(turno => turno.especialista ?? ''))).filter(Boolean);
  }



  aplicarFiltro() {
    const filtroLower = this.filtro.toLowerCase();
    this.turnosFiltrados = this.turnos.filter(turno =>
      (turno.especialidad?.toLowerCase().includes(filtroLower) ||
      turno.especialistaNombre?.toLowerCase().includes(filtroLower) ||
      turno.pacienteNombre?.toLowerCase().includes(filtroLower) ||
      turno.estado?.toLowerCase().includes(filtroLower))
    );
  }

  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelación...',
      showCancelButton: true
    });

    if (comentario) {
      try {
        const turnoRef = doc(this.firestore, 'turnos', turno.id);
        await updateDoc(turnoRef, { estado: 'cancelado', comentario });
        Swal.fire('Turno cancelado', 'El turno ha sido cancelado exitosamente.', 'success');
        await this.cargarTurnos();
      } catch (error) {
        console.error('Error al cancelar el turno:', error);
        Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
      }
    }
  }
}