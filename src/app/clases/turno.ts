export class Turno {
  id: string;
  fecha: Date;
  estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
  especialidad: string;
  paciente: string; // ID del paciente
  especialista: string; // ID del especialista
  pacienteNombre?: string; // Nombre del paciente
  tieneResena?: boolean;
  tieneDiagnostico?: boolean;
  resena?: string;
  calificacion?: string;
  motivoCancelacion?: string;
  motivoRechazo?: string;
  diagnostico?: string;

  constructor(
    id: string,
    fecha: Date,
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado',
    especialidad: string,
    paciente: string,
    especialista: string,
    pacienteNombre?: string,
    tieneResena?: boolean,
    tieneDiagnostico?: boolean,
    resena?: string,
    calificacion?: string,
    motivoCancelacion?: string,
    motivoRechazo?: string,
    diagnostico?: string
  ) {
    this.id = id;
    this.fecha = fecha;
    this.estado = estado;
    this.especialidad = especialidad;
    this.paciente = paciente;
    this.especialista = especialista;
    this.pacienteNombre = pacienteNombre;
    this.tieneResena = tieneResena;
    this.tieneDiagnostico = tieneDiagnostico;
    this.resena = resena;
    this.calificacion = calificacion;
    this.motivoCancelacion = motivoCancelacion;
    this.motivoRechazo = motivoRechazo;
    this.diagnostico = diagnostico;
  }
}
