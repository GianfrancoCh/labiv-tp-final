import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs,doc, getDoc } from '@angular/fire/firestore';
import { Turno } from '../../../clases/turno';


@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css',
})
export class HistoriaClinicaComponent implements OnInit {
  @Input() pacienteId!: string; // ID del paciente
  @Input() especialistaId?: string; // ID del especialista (opcional)
  @Input() isAdmin: boolean = false; // Indica si es un administrador
  historial: any[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    if (this.pacienteId) {
      this.historial = await this.cargarHistorial(this.pacienteId);
    }
    console.log(this.historial)
  }


  async cargarHistorial(usuarioId: string) {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('paciente', '==', usuarioId));
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
  
    // Devolver el historial cargado
    return turnos;
  }
  

}
