import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Usuario } from '../../clases/usuario';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css'],
})
export class PacientesComponent implements OnInit {
  pacientes: Usuario[] = []; // Lista de pacientes atendidos
  usuario: any; // Perfil del usuario logueado
  especialistaId: string = ''; // ID del especialista logueado

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

  async obtenerPacientesAtendidos(especialistaId: string): Promise<Usuario[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialista', '==', especialistaId));
    const snapshot = await getDocs(q);

    const pacientesIds = new Set<string>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data['paciente']) {
        pacientesIds.add(data['paciente']);
      }
    });

    const pacientes: Usuario[] = [];
    for (let id of pacientesIds) {
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
          '', // Contraseña no se incluye por razones de seguridad
          data['aprobado'],
          data['especialidades'] || []
        );
        pacientes.push(paciente);
      }
    }

    return pacientes;
  }
}
