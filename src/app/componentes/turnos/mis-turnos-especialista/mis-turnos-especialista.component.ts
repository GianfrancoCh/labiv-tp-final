import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, query, where, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import Swal from 'sweetalert2';
import { Turno } from '../../../clases/turno';

@Component({
  selector: 'app-mis-turnos-especialista',
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: Turno[] = []; 
  turnosFiltrados: Turno[] = [];
  especialidades: string[] = [];
  pacientes: string[] = [];
  filtroGlobal: string = '';
  usuario: any; 

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'especialista') {
      return;
    }
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialista', '==', this.usuario.uid));
    const snapshot = await getDocs(q);

    const turnos: Turno[] = snapshot.docs.map(doc => {
      const data = doc.data() as any; // Usa 'any' temporalmente para manejar el tipo de fecha
      // Convierte el Timestamp de Firestore a Date
      if (data.fecha && data.fecha.seconds) {
        data.fecha = new Date(data.fecha.seconds * 1000);
      }
      return new Turno(doc.id, data.fecha, data.estado, data.especialidad, data.paciente, data.especialista);
    });

    // Obtener los nombres de los pacientes
    for (let turno of turnos) {
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

    // Maneja 'undefined' al obtener especialidades y pacientes
    this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad ?? ''))).filter(Boolean) as string[];
    this.pacientes = Array.from(new Set(this.turnos.map(turno => turno.pacienteNombre ?? ''))).filter(Boolean) as string[];
  }

  aplicarFiltroGlobal() {
    const filtro = this.filtroGlobal.toLowerCase();
  
    this.turnosFiltrados = this.turnos.filter(turno => {
      return (
        (turno.estado && turno.estado.toLowerCase().includes(filtro)) ||
        (turno.especialidad && turno.especialidad.toLowerCase().includes(filtro)) ||
        (turno.pacienteNombre && turno.pacienteNombre.toLowerCase().includes(filtro))
      );
    });
  }

  async verResena(turno: Turno) {
    try {
      // Referencia al documento del turno en Firebase
      const turnoRef = doc(this.firestore, 'turnos', turno.id);
      const turnoSnapshot = await getDoc(turnoRef);
  
      if (turnoSnapshot.exists()) {
        const data = turnoSnapshot.data();
        const resena = data['resena'] || 'No hay reseña disponible.';
  
        // Mostrar la reseña usando Swal
        Swal.fire({
          title: 'Reseña del Turno',
          text: resena,
          icon: 'info',
          confirmButtonText: 'Cerrar'
        });
      } else {
        Swal.fire({
          title: 'Reseña no disponible',
          text: 'No se encontró información del turno.',
          icon: 'warning',
          confirmButtonText: 'Cerrar'
        });
      }
    } catch (error) {
      console.error('Error al obtener la reseña:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al obtener la reseña del turno.',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    }
  }

  cancelarTurno(turno: Turno) {
    if (turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'rechazado') {
      Swal.fire({
        title: 'Cancelar Turno',
        input: 'textarea',
        inputLabel: 'Motivo de la cancelación',
        showCancelButton: true
      }).then(async result => {
        if (result.isConfirmed && result.value) {
          try {
            // Referencia al documento del turno en Firebase
            const turnoRef = doc(this.firestore, 'turnos', turno.id);
            // Actualizar el estado del turno y guardar el motivo de la cancelación
            await updateDoc(turnoRef, { estado: 'cancelado', motivoCancelacion: result.value });
            Swal.fire('Turno cancelado', 'El turno ha sido cancelado exitosamente.', 'success');
            // Recargar los turnos después de la actualización
            await this.cargarTurnos();
          } catch (error) {
            console.error('Error al cancelar el turno:', error);
            Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
          }
        }
      });
    }
  }

  rechazarTurno(turno: Turno) {
    if (turno.estado !== 'aceptado' && turno.estado !== 'realizado' && turno.estado !== 'cancelado') {
      Swal.fire({
        title: 'Rechazar Turno',
        input: 'textarea',
        inputLabel: 'Motivo del rechazo',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed && result.value) {
          turno.estado = 'rechazado';
          turno.motivoRechazo = result.value;
          Swal.fire('Turno rechazado', 'El turno ha sido rechazado exitosamente.', 'success');
        }
      });
    }
  }

  async aceptarTurno(turno: Turno) {
    if (turno.estado !== 'realizado' && turno.estado !== 'cancelado' && turno.estado !== 'rechazado') {
      try {
        // Referencia al documento del turno en Firebase
        const turnoRef = doc(this.firestore, 'turnos', turno.id);
        // Actualizar el estado del turno a 'aceptado'
        await updateDoc(turnoRef, { estado: 'aceptado' });
        turno.estado = 'aceptado';
        Swal.fire('Turno aceptado', 'El turno ha sido aceptado.', 'success');
        // Recargar los turnos después de la actualización
        await this.cargarTurnos();
      } catch (error) {
        console.error('Error al aceptar el turno:', error);
        Swal.fire('Error', 'Hubo un problema al aceptar el turno.', 'error');
      }
    }
  }

  async finalizarTurno(turno: Turno) {
    if (turno.estado === 'aceptado') {
      const { value: diagnostico } = await Swal.fire({
        title: 'Finalizar Turno',
        input: 'textarea',
        inputLabel: 'Comentario y diagnóstico',
        inputPlaceholder: 'Escribe el diagnóstico aquí...',
        showCancelButton: true
      });
  
      if (diagnostico) {
        try {
          // Referencia al documento del turno en Firebase
          const turnoRef = doc(this.firestore, 'turnos', turno.id);
          // Actualizar el estado, el diagnóstico y marcar que tiene reseña
          await updateDoc(turnoRef, { estado: 'realizado', diagnostico, tieneDiagnostico: true });
          turno.estado = 'realizado';
          turno.diagnostico = diagnostico;
          turno.tieneDiagnostico = true; // Actualizar en la lista local también
          Swal.fire('Turno finalizado', 'El turno ha sido finalizado exitosamente.', 'success');
          // Recargar los turnos después de la actualización
          await this.cargarTurnos();
        } catch (error) {
          console.error('Error al finalizar el turno:', error);
          Swal.fire('Error', 'Hubo un problema al finalizar el turno.', 'error');
        }
      }
    }
  }
}
