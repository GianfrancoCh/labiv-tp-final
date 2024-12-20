import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { Usuario } from '../../clases/usuario';
import { CommonModule } from '@angular/common';
import { Firestore, collection, query, where, getDocs, doc, getDoc, setDoc} from '@angular/fire/firestore';
import { MisHorariosComponent } from '../turnos/mis-horarios/mis-horarios.component'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { HistoriaClinicaComponent } from '../turnos/historia-clinica/historia-clinica.component';
import { CaptchaDirective } from '../../directivas/captcha.directive';
import { CaptchaConfigService } from '../../servicios/captcha-config.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css'],
  imports: [CommonModule, ReactiveFormsModule, MisHorariosComponent, HistoriaClinicaComponent, CaptchaDirective, FormsModule] // Asegúrate de importar MisHorariosComponent
})
export class MiPerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  historial: any[] = [];
  logoUrl: string = '';
  especialidades: string[] = []; // Lista de especialidades disponibles
  especialidadSeleccionada: string = ''; // Especialidad seleccionada por el usuario
  
  captchaValido: boolean = false;
  captchaHabilitado: boolean = true;
  constructor(private authService: AuthService, private fb: FormBuilder, private firestore: Firestore, private captchaConfigService: CaptchaConfigService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.usuario = await this.authService.getUserProfile();
      if (this.usuario?.tipoUsuario === 'paciente') {
        this.historial = await this.cargarTurnos(this.usuario.uid);

        // Extraer especialidades únicas de los turnos
        this.especialidades = Array.from(new Set(this.historial.map((turno) => turno.especialidad || '')));
      }
      if (this.usuario?.tipoUsuario === 'administrador') {
        this.captchaHabilitado = await this.captchaConfigService.obtenerEstadoCaptcha();
      }

      this.captchaHabilitado = await this.captchaConfigService.obtenerEstadoCaptcha();
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
    }
  }

  private async obtenerEstadoCaptcha(): Promise<boolean> {
    const configRef = doc(this.firestore, 'configuracion', 'captcha');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      return configSnap.data()['habilitado'] ?? true; // Por defecto, habilitado
    }
    return true;
  }

  // Cambiar el estado del captcha
  async toggleCaptcha(event: Event): Promise<void> {
    const habilitado = (event.target as HTMLInputElement).checked;
    this.captchaHabilitado = habilitado;

    try {
      await this.captchaConfigService.setCaptchaHabilitado(habilitado);
      console.log('Estado del captcha actualizado:', habilitado);
    } catch (error) {
      console.error('Error al actualizar el estado del captcha:', error);
    }
  }

  async cargarTurnos(usuarioId: string): Promise<any[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('paciente', '==', usuarioId));
    const snapshot = await getDocs(q);

    const turnos = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      if (data.fecha && data.fecha.seconds) {
        data.fecha = new Date(data.fecha.seconds * 1000).toLocaleDateString();
      }
      return { id: doc.id, ...data };
    });

    for (let turno of turnos) {
      if (turno.especialista) {
        const especialistaRef = doc(this.firestore, 'usuarios', turno.especialista);
        const especialistaSnapshot = await getDoc(especialistaRef);
        turno.especialistaNombre = especialistaSnapshot.exists()
          ? especialistaSnapshot.data()['nombre']
          : 'Desconocido';
      }
    }

    return turnos;
  }

  async generarHistoriaClinicaPDF() {
    const logoUrl = 'https://cdn-icons-png.flaticon.com/512/75/75264.png';

      try {
        const doc = new jsPDF();

        const logoBase64 = await this.toBase64(logoUrl);
        doc.addImage(logoBase64, 'PNG', 10, 10, 50, 30);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Historia Clínica', 80, 20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 10, 50);

        doc.text(`Paciente: ${this.usuario?.nombre} ${this.usuario?.apellido}`, 10, 60);
        doc.text(`DNI: ${this.usuario?.dni}`, 10, 70);
        doc.text(`Email: ${this.usuario?.email}`, 10, 80);

        // Filtrar historial por especialidad seleccionada
        const historialFiltrado = this.especialidadSeleccionada
          ? this.historial.filter((turno) => turno.especialidad === this.especialidadSeleccionada)
          : this.historial;

        autoTable(doc, {
          startY: 90,
          head: [['Fecha', 'Especialidad', 'Especialista', 'Diagnóstico', 'Reseña']],
          body: historialFiltrado.map((turno) => [
            turno.fecha || 'N/A',
            turno.especialidad || 'N/A',
            turno.especialistaNombre || 'Desconocido',
            `Diagnóstico: ${turno.diagnostico || 'Sin diagnóstico general'}\n
              Altura: ${turno.historiaClinica[0]?.altura || 'N/A'} cm, 
              Peso: ${turno.historiaClinica[0]?.peso || 'N/A'} kg, 
              Temperatura: ${turno.historiaClinica[0]?.temperatura || 'N/A'} °C, 
              Presión: ${turno.historiaClinica[0]?.presion || 'N/A'}`,
            turno.resenaEspecialista || 'Sin reseña',
          ]),
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [76, 175, 80], textColor: 255, fontSize: 11 },
          bodyStyles: { textColor: 50 },
          columnStyles: { 4: { cellWidth: 'auto' } },
        });

        doc.save(`Historia_Clinica_${this.usuario?.nombre}_${this.usuario?.apellido}.pdf`);
      } catch (error) {
        console.error('Error al generar el PDF:', error);
        Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
      }
  }

  private toBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
    });
  }

  onCaptchaResolved(isResolved: boolean): void {
    this.captchaValido = isResolved; // Actualiza el estado del captcha
    if (isResolved) {
      console.log('CAPTCHA resuelto correctamente.');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Captcha Incorrecto',
        text: 'Por favor, resuelve correctamente el captcha para continuar.',
        confirmButtonText: 'Entendido',
      });
    }
  }
}
