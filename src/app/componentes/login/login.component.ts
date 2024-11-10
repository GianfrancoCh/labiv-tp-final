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

  constructor(private router: Router, private fb: FormBuilder, private firestore: Firestore, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  autocompletarLogin() {
    this.loginForm.patchValue({
      email: "admin@test.com",
      password: "admin1234"
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
  
        if (!user.emailVerified) {
          throw new Error('Correo no verificado. Por favor, verifica tu correo antes de iniciar sesión.');
        }
  
        console.log('UID del usuario al hacer login:', user.uid); // Depuración: verifica el UID
  
        const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
        return getDoc(userDocRef).then(userDoc => {
          if (!userDoc.exists()) {
            throw new Error('Usuario no encontrado en la base de datos.');
          }
  
          const userData = userDoc.data();
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
