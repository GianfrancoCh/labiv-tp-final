import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import {provideHttpClient} from "@angular/common/http";
import { provideAnimations } from '@angular/platform-browser/animations';

const firebaseConfig = {
  apiKey: "AIzaSyAA03qxSOen5q0quwYEfU9Oqu55H0wgsho",
  authDomain: "labiv-tp-final-56381.firebaseapp.com",
  projectId: "labiv-tp-final-56381",
  storageBucket: "labiv-tp-final-56381.firebasestorage.app",
  messagingSenderId: "408083825602",
  appId: "1:408083825602:web:b214743e886a4cf6fa4c5b"
};

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimations(), 
    provideClientHydration(), 
    provideFirebaseApp(() => initializeApp(firebaseConfig)), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient()]
};
