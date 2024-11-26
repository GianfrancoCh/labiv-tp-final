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
  filtroGlobal: string = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  pacientes: string[] = [];
  usuario: any; 

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    
    this.usuario = await this.authService.getUserProfile();
    if (this.usuario.tipoUsuario !== 'paciente') {
      return; 
    }
    await this.cargarTurnos()
  }

  async cargarTurnos() {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('paciente', '==', this.usuario.uid)); // Cambia la condición según tu lógica
    const snapshot = await getDocs(q);
  
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
        data.especialista,
        data.pacienteNombre,
        data.especialistaNombre,
        data.resenaPaciente,
        data.resenaEspecialista,
        data.comentario,
        data.diagnostico,
        data.historiaClinica,
        data.encuesta
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
    }
  
    this.turnos = turnos;
    this.turnosFiltrados = [...this.turnos];
  
    // Configurar especialidades y nombres de especialistas únicos
    this.especialidades = Array.from(new Set(this.turnos.map(turno => turno.especialidad ?? ''))).filter(Boolean) as string[];
    this.especialistas = Array.from(new Set(this.turnos.map(turno => turno.especialistaNombre ?? ''))).filter(Boolean) as string[];
  }

  aplicarFiltroGlobal() {
    const filtro = this.filtroGlobal.toLowerCase();
    
    this.turnosFiltrados = this.turnos.filter(turno => {
      return (
        (turno.estado && turno.estado.toLowerCase().includes(filtro)) ||
        (turno.especialistaNombre && turno.especialistaNombre.toLowerCase().includes(filtro)) ||
        (turno.especialidad && turno.especialidad.toLowerCase().includes(filtro))
      );
    });
  }
  verComentario(turno: Turno) {
    const resena = turno.comentario || 'No hay comentarios disponibles.';
    Swal.fire({
      title: 'Comentario',
      text: resena ? resena : 'No hay comentarios disponibles.',
      icon: 'info',
    });
  }

  verResena(turno: Turno) {
    const resena = turno.resenaEspecialista || 'No hay reseña disponibles.';
    Swal.fire({
      title: 'Reseña',
      text: resena ? resena : 'No hay reseña disponibles.',
      icon: 'info',
    });
  }

  async cancelarTurno(turno: Turno) {
    const { value: comentario } = await Swal.fire({
      title: 'Cancelar Turno',
      input: 'textarea',
      inputLabel: 'Comentario',
      inputPlaceholder: 'Escribe el motivo de la cancelacion...',
      showCancelButton: true
    });
  
    if (comentario) {
      try {
        const motivoCancelacion = `Motivo cancelacion: ${comentario}`;
        const turnoRef = doc(this.firestore, 'turnos', turno.id);
        await updateDoc(turnoRef, { estado: 'cancelado', comentario: motivoCancelacion });
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
          turno.resenaPaciente = resena; 
          Swal.fire('Reseña guardada', 'Tu reseña ha sido guardada exitosamente.', 'success');
          
          await this.cargarTurnos();
        } catch (error) {
          console.error('Error al guardar la reseña:', error);
          Swal.fire('Error', 'Hubo un problema al guardar la reseña.', 'error');
        }
      }
    }
  }


  async completarEncuesta(turno: Turno) {
    if (turno.estado === 'realizado' && turno.diagnostico.length > 0) {
      const { value: respuestas } = await Swal.fire({
        title: 'Completar Encuesta',
        html: `
          <label>¿Cómo calificarías la atención?</label>
          <select id="atencion" class="swal2-select">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label>¿Fue puntual el especialista?</label>
          <select id="puntualidad" class="swal2-select">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const atencion = (document.getElementById('atencion') as HTMLSelectElement).value;
          const puntualidad = (document.getElementById('puntualidad') as HTMLSelectElement).value;
  
          if (!atencion || !puntualidad) {
            Swal.showValidationMessage('Debes completar ambas preguntas');
            return null;
          }
  
          return [
            { pregunta: '¿Cómo calificarías la atención?', respuesta: atencion },
            { pregunta: '¿Fue puntual el especialista?', respuesta: puntualidad }
          ];
        }
      });
  
      if (respuestas) {
        try {
          const turnoRef = doc(this.firestore, 'turnos', turno.id);
          await updateDoc(turnoRef, { encuesta: respuestas });
  
          turno.encuesta = respuestas; // Actualizar localmente
          Swal.fire('Encuesta enviada', 'Gracias por completar la encuesta.', 'success');
  
          await this.cargarTurnos();
        } catch (error) {
          console.error('Error al completar la encuesta:', error);
          Swal.fire('Error', 'Hubo un problema al enviar la encuesta.', 'error');
        }
      }
    } else {
      Swal.fire('Acción no permitida', 'El turno no cumple con los requisitos para completar la encuesta.', 'warning');
    }
  }
}
