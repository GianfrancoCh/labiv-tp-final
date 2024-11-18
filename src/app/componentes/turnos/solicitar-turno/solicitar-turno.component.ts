import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es'); // Configura Moment.js para usar el español

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SolicitarTurnoComponent implements OnInit {
  especialistas: any[] = [];
  especialidades: any[] = [];
  diasDisponibles: string[] = [];
  horariosDisponibles: string[] = [];
  cargando: boolean = true;

  especialistaSeleccionado: any = null;
  especialidadSeleccionada: string = '';
  diaSeleccionado: string = '';

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    try {
      await this.cargarEspecialistas();
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
    console.log('Especialistas cargados:', this.especialistas);
  }

  seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    this.especialidades = especialista.especialidades;
    console.log('Especialista seleccionado:', especialista);
  }

  seleccionarEspecialidad(especialidad: any) {
    this.especialidadSeleccionada = especialidad.nombre;
    this.diasDisponibles = this.generarDiasDisponibles(especialidad.disponibilidad || []);
    console.log('Especialidad seleccionada:', especialidad);
    console.log('Días disponibles:', this.diasDisponibles);
  }

  generarDiasDisponibles(disponibilidad: any[]): string[] {
    const diasDisponibles: string[] = [];
    const hoy = moment();

    // Generar los próximos 15 días
    for (let i = 0; i < 15; i++) {
      const dia = hoy.clone().add(i, 'days');
      const diaSemana = dia.format('dddd').toLowerCase(); // Obtener el nombre del día en español y en minúsculas

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

    console.log('Día seleccionado:', dia);
    console.log('Horarios disponibles:', this.horariosDisponibles);
  }
}