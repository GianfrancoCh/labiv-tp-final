import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Firestore, collection, setDoc, doc } from '@angular/fire/firestore'; 
import { Auth, sendEmailVerification } from '@angular/fire/auth'; 

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule]
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  tipoUsuario: 'paciente' | 'especialista' = 'paciente'; 
  imgFile1Label: string = '';  
  imgFile2Label: string = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router, 
    private firestore: Firestore,
    private auth: Auth // Inyectar Auth de Firebase
  ) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      tipoUsuario: ['paciente', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      obraSocial: [''], 
      especialidad: [''], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagenes: this.fb.array([], [Validators.minLength(1)]) 
    });
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

  onSubmit() {
    console.log('Formulario válido:', this.registroForm.valid);
    console.log('Errores en el formulario:', this.registroForm.errors);
  
    if (this.registroForm.invalid) {
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
  
        console.log('UID del usuario:', user.uid); // Depuración: verifica el UID
  
        // Enviar el correo de verificación
        return sendEmailVerification(user).then(() => {
          // Guardar datos del usuario en Firestore
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
          console.log('Datos del usuario que se guardarán:', userData); // Depuración: verifica los datos
  
          return setDoc(doc(this.firestore, `usuarios/${user.uid}`), userData); // Asegúrate de usar el UID
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
        console.error('Error general:', e);
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
