import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Usuario } from '../../clases/usuario';
import { AuthService } from '../../servicios/auth.service';
import { HistoriaClinicaComponent } from '../turnos/historia-clinica/historia-clinica.component';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, HistoriaClinicaComponent],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css'],
})
export class PacientesComponent implements OnInit {
  pacientes: Usuario[] = []; 
  usuario: any;
  especialistaId: string = ''; 
  pacienteSeleccionado: Usuario | null = null;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  async ngOnInit() {
    try {
      // Obtener el perfil del usuario logueado
      this.usuario = await this.authService.getUserProfile();
      this.especialistaId = this.usuario.uid;

      // Cargar la lista de pacientes atendidos por el especialista
      this.pacientes = await this.obtenerPacientesAtendidos(this.especialistaId);
      console.log('Pacientes atendidos:', this.pacientes);
    } catch (error) {
      console.error('Error al cargar los pacientes:', error);
    }
  }

 

  mostrarHistoriaClinica(usuario: Usuario): void {
    console.log(`Mostrando historia clínica del paciente: ${usuario.id}`);
    this.pacienteSeleccionado =
    this.pacienteSeleccionado?.id === usuario.id ? null : usuario;
  }

  async obtenerPacientesAtendidos(especialistaId: string): Promise<Usuario[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialista', '==', especialistaId));
    const snapshot = await getDocs(q);
  
    const pacientesMap = new Map<string, any>();
  
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data['paciente']) {
        const pacienteId = data['paciente'];
    
        // Convierte el timestamp de Firebase a una fecha válida
        const turno = { 
          fecha: data['fecha']?.toDate?.() || data['fecha'], 
          detalle: data['detalle'] 
        };
    
        if (!pacientesMap.has(pacienteId)) {
          pacientesMap.set(pacienteId, { turnos: [] });
        }
    
        pacientesMap.get(pacienteId).turnos.push(turno);
      }
    });
  
    const pacientes: Usuario[] = [];
    for (let [id, pacienteData] of pacientesMap.entries()) {
      const pacienteDoc = doc(this.firestore, 'usuarios', id);
      const pacienteSnapshot = await getDoc(pacienteDoc);
      if (pacienteSnapshot.exists()) {
        const data = pacienteSnapshot.data();
        const paciente = new Usuario(
          data['tipoUsuario'],
          data['uid'],
          id,
          data['nombre'],
          data['apellido'],
          data['edad'],
          data['dni'],
          data['imgUrl1'],
          data['imgUrl2'],
          data['email'],
          '', 
          data['aprobado'],
          data['especialidades'] || []
        );
  
        // Agregar los últimos 3 turnos al paciente
        paciente['ultimosTurnos'] = pacienteData.turnos.slice(-3).reverse();
        pacientes.push(paciente);
      }
    }
  
    return pacientes;
  }
}
