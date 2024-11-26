export class Turno {
  id: string;
  fecha: Date;
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
  especialidad: string;
  paciente: string; // ID del paciente
  especialista: string; // ID del especialista
  pacienteNombre?: string; // Nombre del paciente
  especialistaNombre?: string; // Nombre del especialista
  resenaPaciente: string;
  resenaEspecialista: string;
  encuestaPaciente?: string;
  comentario: string = '';
  diagnostico: string;
  encuesta: string = '';

  constructor(
    id: string,
    fecha: Date,
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado',
    especialidad: string,
    paciente: string,
    especialista: string,
    pacienteNombre?: string,
    especialistaNombre?: string,
    resenaPaciente: string = '',
    resenaEspecialista: string = '',
    comentario: string = '',
    diagnostico: string = '',
    encuesta: string = ''
  ) {
    this.id = id;
    this.fecha = fecha;
    this.estado = estado;
    this.especialidad = especialidad;
    this.paciente = paciente;
    this.especialista = especialista;
    this.pacienteNombre = pacienteNombre;
    this.especialistaNombre = especialistaNombre;
    this.resenaPaciente = resenaPaciente;
    this.resenaEspecialista = resenaEspecialista;
    this.comentario = comentario;
    this.diagnostico = diagnostico;
    this.encuesta = encuesta;
  }
}
