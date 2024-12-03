import { Component, OnInit } from '@angular/core';
import { Firestore, collection, updateDoc, getDocs, addDoc, query, where, doc, getDoc} from '@angular/fire/firestore';
import { AuthService } from '../../servicios/auth.service'; // Importa tu servicio de autenticación
import Swal from 'sweetalert2';
import { Usuario } from '../../clases/usuario'; // Importa la interfaz de Usuario
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { HistoriaClinicaComponent } from '../turnos/historia-clinica/historia-clinica.component';
import { HighlightUserTypeDirective } from '../../directivas/usuario-highlight.directive';
import { NombreEspecialistaPipe } from '../../pipes/nombre-especialista.pipe';
import { HoverEffectDirective } from '../../directivas/hover-effect.directive';
import { CensurarEmailPipe } from '../../pipes/censurar-email.pipe';

interface Especialidad {
  id: string;
  name: string;
}

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HistoriaClinicaComponent, HighlightUserTypeDirective, NombreEspecialistaPipe, HoverEffectDirective, CensurarEmailPipe]
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  isAdmin: boolean = false; 
  registroForm!: FormGroup;
  imagenSeleccionada: File | null = null;
  tipoUsuario: 'paciente' | 'especialista' | 'administrador' = 'paciente';
  especialidades: Especialidad[] = [];
  pacienteSeleccionado: Usuario | null = null;

  constructor(private firestore: Firestore, private authService: AuthService, private fb: FormBuilder) {}

  async ngOnInit(): Promise<void> {
    // Cargar los usuarios y especialidades al inicializar el componente
    this.cargarUsuarios();
    this.cargarEspecialidades();
  
    try {
      const userProfile: Usuario = await this.authService.getUserProfile();
      this.isAdmin = userProfile.tipoUsuario === 'administrador';
  
      if (this.isAdmin) {
        this.inicializarFormulario();
      } else {
        Swal.fire('Acceso denegado', 'Solo los Administradores pueden acceder a esta sección.', 'error');
      }
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      Swal.fire('Error', 'No se pudo verificar el perfil del usuario.', 'error');
    }
  }

  async descargarTurnos(usuario: Usuario) {
    try {
      if (usuario.tipoUsuario !== 'paciente') {
        Swal.fire('Error', 'Solo se pueden descargar los turnos de los pacientes.', 'error');
        return;
      }
  
      const turnosRef = collection(this.firestore, 'turnos');
      const q = query(turnosRef, where('paciente', '==', usuario.id));
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        Swal.fire('Sin turnos', 'Este paciente no tiene turnos registrados.', 'info');
        return;
      }
  
      const turnosData = [];
  
      for (const document of snapshot.docs) {
        const data = document.data() as any;
  
        if (data.fecha && data.fecha.seconds) {
          data.fecha = new Date(data.fecha.seconds * 1000).toLocaleString();
        }
  
        // Obtener el nombre del especialista
        if (data.especialista) {
          const especialistaRef = doc(this.firestore, `usuarios/${data.especialista}`);
          const especialistaSnapshot = await getDoc(especialistaRef);
  
          if (especialistaSnapshot.exists()) {
            const especialistaData = especialistaSnapshot.data() as { nombre: string };
            data.especialistaNombre = especialistaData?.nombre || 'Desconocido';
          } else {
            data.especialistaNombre = 'Desconocido';
          }
        } else {
          data.especialistaNombre = 'No asignado';
        }
  
        turnosData.push({
          Fecha: data.fecha,
          Especialidad: data.especialidad,
          Especialista: data.especialistaNombre,
          Estado: data.estado || 'Sin estado',
        });
      }
  
      // Exportar a Excel
      const hoja = XLSX.utils.json_to_sheet(turnosData);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, `Turnos de ${usuario.nombre}`);
      XLSX.writeFile(libro, `turnos-${usuario.nombre}-${usuario.apellido}.xlsx`);
  
      Swal.fire('Descarga exitosa', 'El archivo de turnos se ha descargado.', 'success');
    } catch (error) {
      console.error('Error al descargar turnos:', error);
      Swal.fire('Error', 'No se pudieron descargar los turnos.', 'error');
    }
  }
  

  mostrarHistoriaClinica(usuario: Usuario): void {
    console.log(`Mostrando historia clínica del paciente: ${usuario.id}`);
    this.pacienteSeleccionado = this.pacienteSeleccionado?.id === usuario.id ? null : usuario;
  }

  async cargarEspecialidades() {
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const snapshot = await getDocs(specialtiesRef);
      this.especialidades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Especialidad));
      console.log('Especialidades cargadas:', this.especialidades); // Mensaje de depuración para verificar la carga
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  inicializarFormulario() {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      tipoUsuario: ['administrador', Validators.required],
      imagen: [null, Validators.required],
      obraSocial: [''],
      especialidad: ['']
    });
  }

  cargarUsuarios() {
    const usuariosCollection = collection(this.firestore, 'usuarios');
    getDocs(usuariosCollection)
      .then(snapshot => {
        this.usuarios = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Usuario[];
        console.log('Usuarios cargados:', this.usuarios); // Mensaje de depuración para confirmar que los usuarios se cargaron
      })
      .catch(error => {
        console.error('Error al cargar usuarios:', error);
        Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
      });
  }
  
  crearUsuario() {
    if (this.registroForm.invalid || !this.imagenSeleccionada) {
      Swal.fire('Error', 'Completa todos los campos correctamente.', 'error');
      this.registroForm.markAllAsTouched();
      return;
    }

    const { email, password, ...userData } = this.registroForm.value;
    this.authService.registro(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        if (!user) throw new Error('Error al crear el usuario.');

        // Crear el objeto usuario con los datos del formulario
        const newUser: Usuario = {
          ...userData,
          id: user.uid,
          email: email,
          imgUrl1: this.imagenSeleccionada ? this.imagenSeleccionada.name : '',
          aprobado: userData.tipoUsuario === 'especialista' ? false : true
        };

        const usuariosCollection = collection(this.firestore, 'usuarios');
        return addDoc(usuariosCollection, newUser);
      })
      .then(() => {
        Swal.fire('Usuario creado', 'El usuario ha sido creado correctamente.', 'success');
        this.cargarUsuarios();
      })
      .catch(error => {
        console.error('Error al crear usuario:', error);
        Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
      });
  }

  setTipoUsuario(tipo: 'paciente' | 'especialista' | 'administrador') {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);

    if (tipo === 'paciente') {
      this.registroForm.get('obraSocial')?.setValidators(Validators.required);
      this.registroForm.get('especialidad')?.clearValidators();
    } else if (tipo === 'especialista') {
      this.registroForm.get('especialidad')?.setValidators(Validators.required);
      this.registroForm.get('obraSocial')?.clearValidators();
    } else {
      this.registroForm.get('obraSocial')?.clearValidators();
      this.registroForm.get('especialidad')?.clearValidators();
    }

    this.registroForm.get('obraSocial')?.updateValueAndValidity();
    this.registroForm.get('especialidad')?.updateValueAndValidity();
  }

  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
    }
  }

  habilitarEspecialista(usuario: Usuario) {
    const usuarioRef = doc(this.firestore, `usuarios/${usuario.id}`);
    updateDoc(usuarioRef, { aprobado: true }).then(() => {
      Swal.fire('Habilitado', 'El usuario especialista ha sido habilitado.', 'success');
      this.cargarUsuarios();
    });
  }
  
  inhabilitarEspecialista(usuario: Usuario) {
    const usuarioRef = doc(this.firestore, `usuarios/${usuario.id}`);
    updateDoc(usuarioRef, { aprobado: false }).then(() => {
      Swal.fire('Inhabilitado', 'El usuario especialista ha sido inhabilitado.', 'warning');
      this.cargarUsuarios();
    });
  }

  exportarUsuariosExcel() {
    if (!this.isAdmin) {
      Swal.fire('Acceso denegado', 'Solo los Administradores pueden exportar datos.', 'error');
      return;
    }

    // Define los datos que deseas incluir en el Excel
    const datosUsuarios = this.usuarios.map(usuario => ({
      Nombre: usuario.nombre,
      Apellido: usuario.apellido,
      Email: usuario.email,
      Tipo: usuario.tipoUsuario,
    }));

    // Crea una hoja de trabajo
    const hoja = XLSX.utils.json_to_sheet(datosUsuarios);

    // Crea un libro de trabajo y agrega la hoja
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Usuarios');

    // Genera el archivo Excel y lo descarga
    XLSX.writeFile(libro, 'lista-usuarios.xlsx');
  }
}
