import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Firestore, collection, setDoc, doc,getDocs, addDoc} from '@angular/fire/firestore';
import { Auth, sendEmailVerification } from '@angular/fire/auth';
import { RecaptchaModule } from 'ng-recaptcha'; 

interface Especialidad {
  id: string;
  name: string;
}


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, RecaptchaModule, FormsModule] // Agrega RecaptchaModule
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' = 'paciente'; 
  imgFile1Label: string = '';  
  imgFile2Label: string = '';
  recaptchaResponse: string | null = null; // Variable para almacenar la respuesta del CAPTCHA
  especialidades: Especialidad[] = [];
  nuevaEspecialidad: string = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router, 
    private firestore: Firestore,
    private auth: Auth
  ) {
    
  }

  ngOnInit(): void {

    this.registroForm = this.fb.group({
      tipoUsuario: ['paciente', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]], 
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]], 
      obraSocial: [''],
      especialidad: [''],
      nuevaEspecialidad: [''],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ],
      imagenes: this.fb.array([], [Validators.minLength(1)])
    });

    this.cargarEspecialidades()

    this.registroForm.get('especialidad')?.valueChanges.subscribe(value => {
      if (value === 'otra') {
        this.registroForm.get('especialidadNueva')?.setValidators(Validators.required);
      } else {
        this.registroForm.get('especialidadNueva')?.clearValidators();
      }
      this.registroForm.get('especialidadNueva')?.updateValueAndValidity();
    });
  }


  async cargarEspecialidades() {
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const snapshot = await getDocs(specialtiesRef);
      this.especialidades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Especialidad));
    } catch (error) {
      console.error('Error al cargar las especialidades:', error);
    }
  }

  async agregarEspecialidad() {
    const nuevaEspecialidad = this.registroForm.get('nuevaEspecialidad')?.value?.trim();
    if (!nuevaEspecialidad) {
      Swal.fire('Error', 'La especialidad no puede estar vacía', 'error');
      return;
    }
  
    try {
      const specialtiesRef = collection(this.firestore, 'especialidades');
      const newSpec = { name: nuevaEspecialidad };
  
      
      const docRef = await addDoc(specialtiesRef, newSpec);
  
      this.especialidades.push({ id: docRef.id, name: nuevaEspecialidad });
  
      this.registroForm.get('nuevaEspecialidad')?.reset();
  
      Swal.fire('Éxito', 'Especialidad agregada correctamente', 'success');
    } catch (error) {
      console.error('Error al agregar la especialidad:', error);
      Swal.fire('Error', 'No se pudo agregar la especialidad', 'error');
    }
  }

  setTipoUsuario(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);

    if (tipo === 'paciente') {
      this.registroForm.get('obraSocial')?.setValidators(Validators.required);
      this.registroForm.get('especialidad')?.clearValidators();
    } else if (tipo === 'especialista') {
      this.registroForm.get('especialidad')?.setValidators(Validators.required);
      this.registroForm.get('obraSocial')?.clearValidators();
    }

    this.registroForm.get('obraSocial')?.updateValueAndValidity();
    this.registroForm.get('especialidad')?.updateValueAndValidity();
  }

  get imagenes() {
    return this.registroForm.get('imagenes') as FormArray;
  }

  agregarImagen($event: any) {
    const auxFile: File = $event.target.files[0];
    if (!auxFile || !auxFile.type.startsWith('image')) {
      Swal.fire('Oops...', 'Debes elegir un archivo de tipo imagen.', 'error');
      return;
    }
    this.imagenes.push(this.fb.control(auxFile));
  }

  onCaptchaResolved(response: string | null) {
    this.recaptchaResponse = response ? response : '';
  }
  

  onSubmit() {
    if (this.registroForm.invalid || !this.recaptchaResponse) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const formData = this.registroForm.value;
    this.authService.registro(formData.email, formData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (!user) {
          throw new Error('El objeto user no está definido.');
        }

        return sendEmailVerification(user).then(() => {
          const userCollection = collection(this.firestore, 'usuarios');
          const userData = {
            uid: user.uid,
            tipoUsuario: formData.tipoUsuario,
            nombre: formData.nombre,
            apellido: formData.apellido,
            edad: formData.edad,
            dni: formData.dni,
            obraSocial: formData.tipoUsuario === 'paciente' ? formData.obraSocial : null,
            especialidad: formData.tipoUsuario === 'especialista' ? formData.especialidad : null,
            email: formData.email,
            aprobado: formData.tipoUsuario === 'especialista' ? false : true,
            fechaRegistro: new Date(),
          };
          return setDoc(doc(this.firestore, `usuarios/${user.uid}`), userData);
        });
      })
      .then(() => {
        Swal.fire({
          title: 'Registro exitoso',
          text: 'Por favor, verifica tu correo electrónico para completar el registro.',
          icon: 'success'
        }).then(() => {
          this.router.navigate(['/home']);
        });
      })
      .catch((e) => {
        const errorMsg = this.obtenerMensajeDeError(e.code);
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: errorMsg
        });
      });
  }

  obtenerMensajeDeError(codigo: string): string {
    switch (codigo) {
      case 'auth/invalid-email':
        return 'El email es inválido';
      case 'auth/email-already-in-use':
        return 'El email ya está en uso';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
      default:
        return 'Ocurrió un error desconocido';
    }
  }
}
