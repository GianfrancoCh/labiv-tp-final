import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Firestore, collection, setDoc, doc,getDocs, addDoc} from '@angular/fire/firestore';
import { Auth, sendEmailVerification } from '@angular/fire/auth';
import { RecaptchaModule } from 'ng-recaptcha'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Especialidad } from '../../clases/especialidad';

// interface Especialidad {
//   id: string;
//   name: string;
// }


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
  imgFiles: File[] = [];

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
      especialidades: this.fb.array([], Validators.required),
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


    console.log(this.especialidades)
  }

  get especialidadesArray(): FormArray {
    return this.registroForm.get('especialidades') as FormArray;
  }

  agregarEspecialidadExistente(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const especialidadId = selectElement.value;
    
    if (especialidadId) {
      const especialidad = this.especialidades.find(esp => esp.id === especialidadId);
      if (especialidad && !this.especialidadesArray.value.includes(especialidad.nombre)) {
        this.especialidadesArray.push(this.fb.control(especialidad.nombre));
      }
    }
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
      const newSpec = { nombre: nuevaEspecialidad };
  
      
      const docRef = await addDoc(specialtiesRef, newSpec);
  
      this.especialidades.push({ id: docRef.id, nombre: nuevaEspecialidad });
  
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
    const file = $event.target.files[0];
    if (!file || !file.type.startsWith('image')) {
      Swal.fire('Oops...', 'Debes elegir un archivo de tipo imagen.', 'error');
      return;
    }
    this.imgFiles.push(file); // Almacena la imagen seleccionada
  }

  async subirImagenes(uid: string, tipoUsuario: string): Promise<{ imgUrl1: string, imgUrl2?: string }> {
    const storage = getStorage();
    let imgUrl1 = '';
    let imgUrl2 = '';
  
    // Sube la primera imagen
    if (this.imgFiles[0]) {
      const file1 = this.imgFiles[0];
      const fileName1 = `usuarios/${uid}/1-${file1.name}`;
      const storageRef1 = ref(storage, fileName1);
  
      await uploadBytes(storageRef1, file1);
      imgUrl1 = await getDownloadURL(storageRef1);
    }
  
    // Sube la segunda imagen solo si el usuario es un paciente
    if (tipoUsuario === 'paciente' && this.imgFiles[1]) {
      const file2 = this.imgFiles[1];
      const fileName2 = `usuarios/${uid}/2-${file2.name}`;
      const storageRef2 = ref(storage, fileName2);
  
      await uploadBytes(storageRef2, file2);
      imgUrl2 = await getDownloadURL(storageRef2);
    }
  
    return { imgUrl1, imgUrl2 };
  }

  onCaptchaResolved(response: string | null) {
    this.recaptchaResponse = response ? response : '';
  }
  

  async onSubmit() {
    if (this.registroForm.invalid || !this.recaptchaResponse) {
      this.registroForm.markAllAsTouched();
      return;
    }
  
    try {
      const formData = this.registroForm.value;
      const userCredential = await this.authService.registro(formData.email, formData.password);
      const user = userCredential.user;
      if (!user) throw new Error('El objeto user no está definido.');
  
      // Sube las imágenes a Firebase Storage y obtiene las URLs
      const { imgUrl1, imgUrl2 } = await this.subirImagenes(user.uid, formData.tipoUsuario);
  
      await sendEmailVerification(user);
  
      const userCollection = collection(this.firestore, 'usuarios');
      const userData: any = {
        uid: user.uid,
        tipoUsuario: formData.tipoUsuario,
        nombre: formData.nombre,
        apellido: formData.apellido,
        edad: formData.edad,
        dni: formData.dni,
        obraSocial: formData.tipoUsuario === 'paciente' ? formData.obraSocial : null,
        especialidades: formData.tipoUsuario === 'especialista' ? formData.especialidades || [] : null, // Corrige aquí
        email: formData.email,
        imgUrl1, // Guarda imgUrl1
        aprobado: formData.tipoUsuario === 'especialista' ? false : true,
        fechaRegistro: new Date()
      };
  
      // Agrega imgUrl2 solo si es un paciente
      if (formData.tipoUsuario === 'paciente') {
        userData.imgUrl2 = imgUrl2;
      }
  
      await setDoc(doc(this.firestore, `usuarios/${user.uid}`), userData);
  
      Swal.fire({
        title: 'Registro exitoso',
        text: 'Por favor, verifica tu correo electrónico para completar el registro.',
        icon: 'success'
      }).then(() => {
        this.router.navigate(['/home']);
      });
    } catch (error) {
      console.error('Error durante el registro:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Registro',
        text: 'Hubo un problema al realizar el registro. Inténtalo de nuevo.'
      });
    }
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
