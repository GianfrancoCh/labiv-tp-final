import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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
    private firestore: Firestore 
  ) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      tipoUsuario: ['paciente'], 
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      edad: ['', [Validators.required, Validators.min(0)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      obraSocial: [''], 
      especialidad: [''], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagenes: this.fb.array([], [Validators.required]) 
    });
  }
  setTipoUsuario(tipo: 'paciente' | 'especialista') {
    this.tipoUsuario = tipo;
    this.registroForm.get('tipoUsuario')?.setValue(tipo);
  }

  // Getter para las imágenes
  get imagenes() {
    return this.registroForm.get('imagenes') as FormArray;
  }

  agregarImagen($event: any) {
    const auxFile: File = $event.target.files[0];

    if (!auxFile || !auxFile.type.startsWith('image')) {
      Swal.fire('Oops...', 'Debes elegir un archivo de tipo imagen.', 'error');
      return;
    }
  
    if ($event.target.id === 'img1') {
      this.imgFile1Label = auxFile.name;
      this.imagenes.push(this.fb.control(auxFile));
    } else if ($event.target.id === 'img2') {
      this.imgFile2Label = auxFile.name;
      this.imagenes.push(this.fb.control(auxFile));
    }
  }

  onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const formData = this.registroForm.value;

    this.authService.registro(formData.email, formData.password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (!user) {
        console.error('El objeto user no está definido.');
        return;
      }

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
      return addDoc(userCollection, userData)
        .catch((error) => {
          console.error('Error al guardar en Firestore:', error);
          throw error; 
        });
    })
    .then(() => {
      Swal.fire({
        title: 'Registro exitoso',
        text: 'El usuario ha sido registrado con éxito.',
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
