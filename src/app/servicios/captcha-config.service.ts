import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CaptchaConfigService {
  private defaultState = true; // Estado por defecto si no hay datos en Firestore

  constructor(private firestore: Firestore) {}

  // Obtener el estado actual del captcha desde Firestore
  async obtenerEstadoCaptcha(): Promise<boolean> {
    try {
      const configRef = doc(this.firestore, 'configuracion', 'captcha');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        return configSnap.data()['habilitado'] ?? this.defaultState;
      }
      return this.defaultState; // Retornar valor por defecto si no existe
    } catch (error) {
      console.error('Error al cargar el estado del captcha desde Firestore:', error);
      return this.defaultState; // Retornar valor por defecto en caso de error
    }
  }

  // Cambiar el estado del captcha en Firestore
  async setCaptchaHabilitado(valor: boolean): Promise<void> {
    try {
      const configRef = doc(this.firestore, 'configuracion', 'captcha');
      await setDoc(configRef, { habilitado: valor });
    } catch (error) {
      console.error('Error al guardar el estado del captcha:', error);
    }
  }
}
