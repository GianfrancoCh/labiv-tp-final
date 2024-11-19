import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, query, where, updateDoc, doc,getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import { Turno } from '../../../clases/turno'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-turnos-paciente',
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class MisTurnosPacienteComponent implements OnInit {
  turnos: Turno[] = []; 
  turnosFiltrados: Turno[] = [];
  filtroEspecialidad: string = '';
  filtroEspecialista: string = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  usuario: any; 

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'paciente') {
      return; 
    }
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('paciente', '==', this.usuario.uid));
    const snapshot = await getDocs(q);
  
    this.turnos = snapshot.docs.map(doc => {
      const data = doc.data();
      const fecha = (data['fecha'] && data['fecha'].seconds) 
        ? new Date(data['fecha'].seconds * 1000) 
        : new Date();
  
      // Asegúrate de incluir todas las propiedades necesarias
      return new Turno(
        doc.id,
        fecha,
        data['estado'],
        data['especialidad'],
        data['paciente'],
        data['especialista'],
        data['diagnostico'], // Incluye el diagnóstico
        data['tieneDiagnostico'], // Incluye el flag de diagnóstico
        data['motivoCancelacion'],
        data['motivoRechazo'],
        data['tieneResena'],
        data['resena']
      );
    });
    
    this.turnosFiltrados = [...this.turnos];
    this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad ?? ''))).filter(Boolean);
    this.especialistas = Array.from(new Set(this.turnos.map(turno => turno.especialista ?? ''))).filter(Boolean);
  }

  aplicarFiltros() {
    this.turnosFiltrados = this.turnos.filter(turno => {
      const coincideEspecialidad = !this.filtroEspecialidad || turno.especialidad === this.filtroEspecialidad;
      const coincideEspecialista = !this.filtroEspecialista || turno.especialista === this.filtroEspecialista;
      return coincideEspecialidad && coincideEspecialista;
    });
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

  async verDiagnostico(turno: Turno) {
    if (turno.estado === 'realizado') {
      try {
        const turnoRef = doc(this.firestore, 'turnos', turno.id);
        const turnoSnapshot = await getDoc(turnoRef);
  
        if (turnoSnapshot.exists()) {
          const data = turnoSnapshot.data();
          const diagnostico = data['diagnostico'] || 'No hay diagnóstico disponible.';
  
    
          Swal.fire({
            title: 'Diagnóstico del Turno',
            text: diagnostico,
            icon: 'info',
            confirmButtonText: 'Cerrar'
          });
        } else {
          Swal.fire({
            title: 'Diagnóstico no disponible',
            text: 'El turno no tiene diagnóstico o no ha sido realizado.',
            icon: 'warning',
            confirmButtonText: 'Cerrar'
          });
        }
      } catch (error) {
        console.error('Error al obtener el diagnóstico:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al obtener el diagnóstico del turno.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    } else {
      Swal.fire({
        title: 'Diagnóstico no disponible',
        text: 'El turno no tiene diagnóstico o no ha sido realizado.',
        icon: 'warning',
        confirmButtonText: 'Cerrar'
      });
    }
  }

  completarEncuesta(turno: Turno) {
    if (turno.estado === 'realizado' && turno.tieneResena) {
      
      console.log('Completar encuesta del turno:', turno);
    }
  }

  async calificarAtencion(turno: Turno) {
    if (turno.estado === 'realizado') {
     
      const { value: resena } = await Swal.fire({
        title: 'Calificar Atención',
        input: 'textarea',
        inputLabel: 'Escribe tu reseña',
        inputPlaceholder: 'Escribe tu reseña aquí...',
        showCancelButton: true
      });
  
      if (resena) {
        try {
          
          const turnoRef = doc(this.firestore, 'turnos', turno.id);
          
          await updateDoc(turnoRef, { resena });
          turno.resena = resena; 
          Swal.fire('Reseña guardada', 'Tu reseña ha sido guardada exitosamente.', 'success');
          
          await this.cargarTurnos();
        } catch (error) {
          console.error('Error al guardar la reseña:', error);
          Swal.fire('Error', 'Hubo un problema al guardar la reseña.', 'error');
        }
      }
    }
  }
}
