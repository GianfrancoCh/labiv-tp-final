import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../servicios/auth.service';
import moment from 'moment';
import 'moment/locale/es';
import { Usuario } from '../../../clases/usuario';
import { Turno } from '../../../clases/turno';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

moment.locale('es'); // Configura Moment.js para usar el español

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SolicitarTurnoComponent implements OnInit {
  especialistas: any[] = [];
  especialidades: any[] = [];
  pacientes: any[] = []; // Lista de pacientes
  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = [];
  cargando: boolean = true;

  usuario: Usuario | null = null; // Información del usuario logueado
  tipoUsuario: string = ''; // 'paciente' o 'administrador'
  pacienteSeleccionado: Usuario | null = null; // Paciente seleccionado por el administrador

  especialistaSeleccionado: any = null;
  especialidadSeleccionada: string = '';
  diaSeleccionado: string = '';
  horarioSeleccionado: string = '';

  constructor(private firestore: Firestore, private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      this.usuario = await this.authService.getUserProfile();
      this.tipoUsuario = this.usuario?.tipoUsuario || '';
      await this.cargarEspecialistas();
      
      // Si el usuario es un administrador, carga la lista de pacientes
      if (this.tipoUsuario === 'administrador') {
        await this.cargarPacientes();
      }
    } catch (error) {
      console.error('Error al cargar especialistas:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarEspecialistas() {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    const especialistas = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          nombre: data['nombre'],
          apellido: data['apellido'],
          imagen: data['imgUrl1'] || 'ruta-a-imagen-por-defecto.jpg',
          tipoUsuario: data['tipoUsuario'],
          especialidades: []
        };
      })
      .filter(usuario => usuario.tipoUsuario === 'especialista');

    for (const especialista of especialistas) {
      const disponibilidadRef = doc(this.firestore, 'disponibilidad', especialista.uid);
      const disponibilidadDoc = await getDoc(disponibilidadRef);
      if (disponibilidadDoc.exists()) {
        especialista.especialidades = disponibilidadDoc.data()?.['especialidades'] || [];
      }
    }

    this.especialistas = especialistas;
  }

  async cargarPacientes() {
    const usuariosRef = collection(this.firestore, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    const pacientes = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          nombre: data['nombre'],
          apellido: data['apellido'],
          tipoUsuario: data['tipoUsuario']
        };
      })
      .filter(usuario => usuario.tipoUsuario === 'paciente');

    this.pacientes = pacientes;
  }

  seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.especialidades = especialista.especialidades;
  }

  seleccionarEspecialidad(especialidad: any) {
    this.especialidadSeleccionada = especialidad.nombre;
    this.diasDisponibles = this.generarDiasDisponibles(especialidad.disponibilidad || []);
  }

  generarDiasDisponibles(disponibilidad: any[]): string[] {
    const diasDisponibles: string[] = [];
    const hoy = moment();
    for (let i = 0; i < 15; i++) {
      const dia = hoy.clone().add(i, 'days');
      const diaSemana = dia.format('dddd').toLowerCase();
      const disponible = disponibilidad.some((d: any) => d.dia.toLowerCase() === diaSemana);
      if (disponible) {
        diasDisponibles.push(dia.format('YYYY-MM-DD'));
      }
    }
    return diasDisponibles;
  }

  seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    const disponibilidad = this.especialistaSeleccionado.especialidades
      .find((e: any) => e.nombre === this.especialidadSeleccionada)
      ?.disponibilidad.filter((d: any) => d.dia.toLowerCase() === moment(dia).format('dddd').toLowerCase());

    this.horariosDisponibles = [];
    if (disponibilidad && disponibilidad.length > 0) {
      disponibilidad.forEach((d: any) => {
        let desde = moment(d.desde, 'HH:mm');
        const hasta = moment(d.hasta, 'HH:mm');
        while (desde.isBefore(hasta)) {
          const siguiente = desde.clone().add(30, 'minutes');
          if (siguiente.isAfter(hasta)) break;
          this.horariosDisponibles.push(`${desde.format('HH:mm')} - ${siguiente.format('HH:mm')}`);
          desde.add(30, 'minutes');
        }
      });
    }
  }

  seleccionarHorario(horario: string) {
    this.horarioSeleccionado = horario;
  }

  async confirmarTurno() {
    const pacienteUID = this.tipoUsuario === 'administrador' ? this.pacienteSeleccionado?.uid : this.usuario?.uid;
    if (!this.especialistaSeleccionado || !this.especialidadSeleccionada || !this.diaSeleccionado || !this.horarioSeleccionado || !pacienteUID) {
      console.error('Faltan datos para confirmar el turno');
      return;
    }

    try {
      const turnosRef = collection(this.firestore, 'turnos');
      const turnoData: Turno = {
        id: '',
        fecha: new Date(`${this.diaSeleccionado} ${this.horarioSeleccionado.split(' - ')[0]}`),
        estado: 'pendiente',
        especialidad: this.especialidadSeleccionada,
        paciente: pacienteUID,
        especialista: this.especialistaSeleccionado.uid
      };

      const nuevoTurnoDoc = await addDoc(turnosRef, turnoData);
      await updateDoc(nuevoTurnoDoc, { id: nuevoTurnoDoc.id });
      this.router.navigate(['/mis-turnos-paciente']);  
      
    } catch (error) {
      console.error('Error al confirmar el turno:', error);
    }
  }
}
