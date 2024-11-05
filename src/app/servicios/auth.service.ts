import { Injectable, EventEmitter} from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, UserCredential } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedInEmitter = new EventEmitter<boolean>();  

  private currentUser: User | null = null;

  constructor(private auth: Auth) {

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
        this.isLoggedInEmitter.emit(true); 
        return userCredential;
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
}
