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
import { Especialidad } from '../../../clases/especialidad';
import Swal from 'sweetalert2';

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
  especialidadesEspecialista: any[] = [];
  especialidadSeleccionada: string = '';
  diaSeleccionado: string = '';
  horarioSeleccionado: string = '';

  constructor(private firestore: Firestore, private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      this.usuario = await this.authService.getUserProfile();
      this.tipoUsuario = this.usuario?.tipoUsuario || '';
      await this.cargarEspecialidades();
      await this.cargarEspecialistas();
      console.log('Especialidades disponibles:', this.especialidades);
      
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
    console.log('Especialista seleccionado:', especialista);
  
    this.especialidadesEspecialista = especialista.especialidades.map((especialidad: any) => {
   
      const especialidadCompleta = this.especialidades.find(espec => espec.nombre === especialidad.nombre);
  
      if (especialidadCompleta) {
        return especialidadCompleta;
      } else {
        console.warn(`Especialidad desconocida: ${especialidad.nombre}`);
        return new Especialidad(
          'desconocido',
          especialidad.nombre || 'Especialidad Desconocida',
          'https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/especialidades%2Fespecialidad-por-defecto.png?alt=media&token=0218ba02-1cb2-47cb-b5d2-15f2b6687961'
        );
      }
    });
  
    console.log('Especialidades del especialista:', this.especialidadesEspecialista);
  }

  
  async cargarEspecialidades() {
    try {
      
      const especialidadesRef = collection(this.firestore, 'especialidades');

      const snapshot = await getDocs(especialidadesRef);

      this.especialidades = snapshot.docs.map(doc => {
        const data = doc.data();
        return new Especialidad(
          doc.id, 
          data['nombre'], 
          data['imgUrl'] || 'https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/especialidades%2Fespecialidad-por-defecto.png?alt=media&token=0218ba02-1cb2-47cb-b5d2-15f2b6687961' // Imagen por defecto si falta
        );
      });
      
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    }
  }
  
  seleccionarEspecialidad(especialidad: Especialidad) {
    this.especialidadSeleccionada = especialidad.nombre;
    const disponibilidad = this.especialistaSeleccionado.especialidades
      .find((e: any) => e.nombre === especialidad.nombre)?.disponibilidad;
  
    if (disponibilidad) {
      this.diasDisponibles = this.generarDiasDisponibles(disponibilidad);
      console.log('Días disponibles:', this.diasDisponibles);
    } else {
      console.warn('No se encontró disponibilidad para esta especialidad.');
      this.diasDisponibles = [];
    }
  }

  generarDiasDisponibles(disponibilidad: any[]): string[] {
    const diasDisponibles: string[] = [];
    const hoy = moment();
    for (let i = 0; i < 15; i++) {
      const dia = hoy.clone().add(i, 'days');
      const diaSemana = dia.format('dddd').toLowerCase(); // Día de la semana en minúscula
      const disponible = disponibilidad.some((d: any) => d.dia.toLowerCase() === diaSemana);
      if (disponible) {
        diasDisponibles.push(dia.format('YYYY-MM-DD'));
      }
    }
    return diasDisponibles;
  }

  seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    console.log("Día seleccionado:", dia);
  
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
    console.log("Horario seleccionado:", horario);
  }

  async confirmarTurno() {
    const pacienteUID = this.tipoUsuario === 'administrador' ? this.pacienteSeleccionado?.uid : this.usuario?.uid;
    if (!this.especialistaSeleccionado || !this.especialidadSeleccionada || !this.diaSeleccionado || !this.horarioSeleccionado || !pacienteUID) {
      Swal.fire({
        icon: 'error',
        title: 'Faltan datos',
        text: 'Por favor, complete todos los campos para confirmar el turno.',
      });
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
        especialista: this.especialistaSeleccionado.uid,
        resenaEspecialista: '',
        resenaPaciente: '',
        diagnostico: '',
        historiaClinica: [],
        comentario: '',
        encuesta: []
      };

      const nuevoTurnoDoc = await addDoc(turnosRef, turnoData);
      await updateDoc(nuevoTurnoDoc, { id: nuevoTurnoDoc.id });
      this.router.navigate(['/mis-turnos-paciente']);  
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al confirmar el turno. Inténtelo de nuevo.',
      });
      console.error('Error al confirmar el turno:', error);
    }
  }
}