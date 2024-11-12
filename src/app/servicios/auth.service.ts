import { Injectable, EventEmitter} from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Usuario } from '../clases/usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedInEmitter = new EventEmitter<boolean>();  

  private currentUser: User | null = null;

  constructor(private auth: Auth, private firestore: Firestore) {

    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        this.isLoggedInEmitter.emit(true);  
      } else {
        this.currentUser = null;
        this.isLoggedInEmitter.emit(false); 
      }
    });
  }

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password).then((userCredential) => {
      this.isLoggedInEmitter.emit(true);  
      return userCredential; // Devuelve el objeto UserCredential
    });
  }

  registro(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        return this.logout().then(() => {
          return userCredential;
        });
        // this.isLoggedInEmitter.emit(true); 
        // return userCredential;
      });
  }

  logout() {
    return signOut(this.auth).then(() => {
      this.isLoggedInEmitter.emit(false);  
      this.currentUser = null;
    });
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async getUserProfile(): Promise<Usuario> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('No hay un usuario autenticado.');
    }

    const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('Perfil de usuario no encontrado en la base de datos.');
    }

    const userData = userDoc.data() as Usuario; // Tipado del objeto Usuario
    return userData;
  }
}
