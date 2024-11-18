export class Turno {
    id: string;
    fecha: Date;
    estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado';
    especialidad: string;
    paciente: string; // Podrías usar un tipo más específico si tienes una clase o interfaz para pacientes
    especialista: string; // Podrías usar un tipo más específico si tienes una clase o interfaz para especialistas
  
    constructor(
      id: string,
      fecha: Date,
      estado: 'pendiente' | 'aceptado' | 'realizado' | 'cancelado' | 'rechazado',
      especialidad: string,
      paciente: string,
      especialista: string
    ) {
      this.id = id;
      this.fecha = fecha;
      this.estado = estado;
      this.especialidad = especialidad;
      this.paciente = paciente;
      this.especialista = especialista;
    }
}   