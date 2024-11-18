import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, collection, query, addDoc, doc, getDoc} from "@angular/fire/firestore";
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../servicios/auth.service';
import Swal from 'sweetalert2';  


@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  flagError: boolean = false;
  msjError: string = '';
  // usuariosAccesoRapido: Usuario[] = [];

  usuariosAccesoRapido = [
    { nombre: 'Paciente Uno', email: 'gianfranco.chiarizia+test1@gmail.com', password: '1234hola', imgUrl:"https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FzEOCTjvhQoYH9htTdMgiSw0YB8i2%2F1-images%20(1).png?alt=media&token=fd4401ca-85f1-42fd-bc50-57248a0f2c99"},
    { nombre: 'Paciente Dos', email: 'gianfrancochiarizia+test2@gmail.com', password: '1234hola', imgUrl:"https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FnoxQ5DY9FQhbUslJz5B6lrWmQa52%2F1-images%20(2).jpg?alt=media&token=1857e512-ad50-41da-afd2-9cb78da518cd"},
    { nombre: 'Paciente Tres', email: 'gianfrancochiarizia+test4@gmail.com', password: '1234hola', imgUrl:"https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FD65uv4JE6iaNHsOCbsuZVX9C4W32%2F1-images.jpg?alt=media&token=2e1a3c34-db2b-4cd2-80dc-120aa7233655"},
    { nombre: 'Especialista Uno', email: 'gianfrancochiarizia+test3@gmail.com', password: '1234hola', imgUrl:"https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FNkDLrITUJ7TLkt6a1RxOE6UCvsw2%2F1-images%20(4).jpg?alt=media&token=5dce33ac-b36e-4dd3-a5b3-1954f3b3ccf1"},
    { nombre: 'Especialista Dos', email: 'gianfranco.chiarizia+test5@gmail.com', password: '1234hola', imgUrl:"https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FCzmwgIdhzZeigo9PH1ulh9bccim2%2F1-8dc56b05c21e5b4b45fbb937d455b0e9.jpg?alt=media&token=ec68dc88-a9a7-4b30-b503-abd11a116990" },
    { nombre: 'Administrador', email: 'admin@test.com', password: '1234hola', imgUrl: "https://firebasestorage.googleapis.com/v0/b/labiv-tp-final-56381.firebasestorage.app/o/usuarios%2FJb3b5YOB0OVbw38Kro2NGZRT5aX2%2Fimages%20(3).jpg?alt=media&token=b3c1261b-16e6-44d1-a312-809623fd46c3"}
  ];

  constructor(private router: Router, private fb: FormBuilder, private firestore: Firestore, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  autocompletarConUsuario(usuario: { email: string; password: string }) {
    this.loginForm.patchValue({
      email: usuario.email,
      password: usuario.password
    });
  }

  autocompletarLogin() {
    this.loginForm.patchValue({
      email: "admin@test.com",
      password: "1234hola"
    });
  }

  Login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();  
      return;
    }
  
    const email = this.loginForm.get('email')?.value;  
    const password = this.loginForm.get('password')?.value;
  
    this.authService.login(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        console.log('UID del usuario al hacer login:', user.uid); // Depuración: verifica el UID
  
        const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
        return getDoc(userDocRef).then(userDoc => {
          if (!userDoc.exists()) {
            throw new Error('Usuario no encontrado en la base de datos.');
          }
  
          const userData = userDoc.data();
  
          // Excepción para administradores: omitir la verificación de correo
          if (userData['tipoUsuario'] !== 'administrador' && !user.emailVerified) {
            throw new Error('Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.');
          }
  
          // Verificar si el especialista está aprobado
          if (userData['tipoUsuario'] === 'especialista' && !userData['aprobado']) {
            throw new Error('Tu cuenta de especialista no ha sido aprobada por el administrador.');
          }
  
          let col = collection(this.firestore, 'logins');
          return addDoc(col, { fecha: new Date(), "email": email });
        });
      })
      .then(() => {
        Swal.fire({
          title: 'Bienvenid@!',
          text: 'Has iniciado sesión correctamente',
          icon: 'success',
          customClass: {
            popup: 'alert-popup',
            title: 'alert-titulo',
            confirmButton: 'alert-boton'
          }
        }).then(() => {
          this.router.navigate(['/home']);  
        });
      })
      .catch((e) => {
        console.error('Error en el login:', e); 
        let errorMsg = e.message || 'Error desconocido al iniciar sesión';
  
        switch (e.code) {
          case 'auth/wrong-password':
            errorMsg = 'Contraseña incorrecta';
            break;
          case 'auth/invalid-credential':
            errorMsg = 'Credenciales inválidas';
            break;
          case 'auth/user-not-found':
            errorMsg = 'Usuario no encontrado';
            break;
          case 'auth/invalid-email':
            errorMsg = 'Email inválido';
            break;
        }
  
        Swal.fire({
          icon: 'error',
          title: 'Error de Login',
          text: errorMsg,
          customClass: {
            popup: 'alert-popup',
            title: 'alert-titulo-error',
            confirmButton: 'alert-boton'
          }
        });
      });
  }
}
