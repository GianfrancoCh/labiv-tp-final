import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Usuario } from '../../../clases/usuario';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MisHorariosComponent implements OnInit {
  horariosForm!: FormGroup;
  @Input() usuario: Usuario | null = null;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  opcionesHorario: string[] = [];

  constructor(private fb: FormBuilder, private firestore: Firestore) {}

  async ngOnInit(): Promise<void> {
    // Inicializar el formulario
    this.horariosForm = this.fb.group({
      especialidades: this.fb.array([])
    });

    // Cargar especialidades y horarios si existen
    if (this.usuario?.especialidades) {
      this.usuario.especialidades.forEach(especialidad => this.agregarEspecialidad(especialidad));
    }

    this.generarOpcionesHorario();

    // Cargar horarios existentes desde Firestore
    if (this.usuario?.uid) {
      const userDocRef = doc(this.firestore, `disponibilidad/${this.usuario.uid}`);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.cargarHorariosExistentes(data ? data['especialidades'] || [] : []);
      }
    }
  }

  cargarHorariosExistentes(especialidades: any[]) {
    especialidades.forEach((especialidad: any) => {
      const index = this.especialidades.controls.findIndex(
        (control) => control.get('nombre')?.value === especialidad.nombre
      );

      if (index === -1) {
        this.agregarEspecialidad(especialidad.nombre);
      }

      const especialidadIndex = this.especialidades.controls.findIndex(
        (control) => control.get('nombre')?.value === especialidad.nombre
      );

      especialidad.disponibilidad.forEach((horario: any) => {
        this.agregarHorario(especialidadIndex);
        const horarioForm = this.getHorarios(especialidadIndex).at(
          this.getHorarios(especialidadIndex).length - 1
        );
        horarioForm.patchValue(horario);
      });
    });
  }

  generarOpcionesHorario() {
    for (let hour = 8; hour <= 18; hour++) {
      this.opcionesHorario.push(`${hour}:00`);
      if (hour < 18) {
        this.opcionesHorario.push(`${hour}:30`);
      }
    }
  }

  get especialidades(): FormArray {
    return this.horariosForm.get('especialidades') as FormArray;
  }

  agregarEspecialidad(nombre: string = '') {
    const especialidadForm = this.fb.group({
      nombre: [nombre, Validators.required],
      disponibilidad: this.fb.array([])
    });
    this.especialidades.push(especialidadForm);
  }

  getHorarios(index: number): FormArray {
    return this.especialidades.at(index).get('disponibilidad') as FormArray;
  }

  agregarHorario(index: number) {
    const horarioForm = this.fb.group({
      dia: ['', Validators.required],
      desde: ['', [Validators.required, this.validarIntervalo, this.validarRango]],
      hasta: ['', [Validators.required, this.validarIntervalo, this.validarRango]]
    });
    this.getHorarios(index).push(horarioForm);
  }

  seleccionarDia(index: number, dia: string) {
    const disponibilidadArray = this.getHorarios(index);
    const existeDia = disponibilidadArray.controls.some(horario => horario.get('dia')?.value === dia);

    if (!existeDia) {
      const horarioForm = this.fb.group({
        dia: [dia, Validators.required],
        desde: ['', [Validators.required, this.validarIntervalo, this.validarRango]],
        hasta: ['', [Validators.required, this.validarIntervalo, this.validarRango]]
      });
      disponibilidadArray.push(horarioForm);
    }
  }

  eliminarHorario(especialidadIndex: number, horarioIndex: number) {
    this.getHorarios(especialidadIndex).removeAt(horarioIndex);
  }

  validarIntervalo(control: any) {
    const value = control.value;
    const [hours, minutes] = value.split(':').map(Number);
    if (minutes !== 0 && minutes !== 30) {
      return { invalidInterval: true };
    }
    return null;
  }

  validarRango(control: any) {
    const value = control.value;
    const [hours] = value.split(':').map(Number);
    if (hours < 8 || hours > 18) {
      return { outOfRange: true };
    }
    return null;
  }

  async guardarHorarios() {
    if (this.horariosForm.invalid) {
      return;
    }
  
    console.log('Usuario antes de guardar:', this.usuario);
  
    if (typeof this.usuario?.uid !== 'string' || !this.usuario.uid) {
      console.error('El UID del usuario no está definido.');
      return;
    }
  
    try {
      // Obtiene los datos actuales del formulario
      const horariosData = this.horariosForm.value;
      const userDocRef = doc(this.firestore, `disponibilidad/${this.usuario.uid}`);
  
      // Combinar los horarios nuevos con los existentes
      const nuevaDataEspecialidades: any[] = [];
  
      horariosData.especialidades.forEach((especialidad: any) => {
        // Solo agregar especialidades que tengan horarios (no vacíos)
        if (especialidad.disponibilidad.length > 0) {
          nuevaDataEspecialidades.push(especialidad);
        }
      });
  
      // Guardar en Firestore solo las especialidades con horarios válidos
      await setDoc(
        userDocRef,
        { uid: this.usuario.uid, especialidades: nuevaDataEspecialidades },
        { merge: true }
      );
      console.log('Horarios guardados correctamente');
    } catch (error) {
      console.error('Error al guardar la disponibilidad:', error);
    }
  }
}
