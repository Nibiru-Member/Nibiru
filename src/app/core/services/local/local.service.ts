import { catchError, map, Observable, of } from 'rxjs';
import { inject, Injectable } from '@angular/core';
import { EncryptionService } from '../encryption/encryption.service';
import { ToasterService } from '../toaster/toaster.service';
@Injectable({
  providedIn: 'root',
})
export class LocalService {
  // private http = inject(HttpService);
  constructor(
    private encryption: EncryptionService,
    private toastr: ToasterService, // private http :HttpService
  ) {}

  setLocalData(key: string, data: any): Observable<boolean> {
    if (key && data) {
      return this.encryption.encrypt(data).pipe(
        map((encryptData) => {
          localStorage.setItem(key, encryptData);
          return true;
        }),
        catchError(() => {
          this.toastr.error('Encryption failed');
          return of(false); // Handle any errors during encryption
        }),
      );
    } else {
      return of(false);
    }
  }

  getLocalData(key: string): Observable<any> {
    if (key) {
      const encryptData = localStorage.getItem(key);
      if (encryptData) {
        return this.encryption.decrypt(encryptData).pipe(
          map((decryptData) => {
            return decryptData;
          }),
          catchError(() => {
            return of(null); // Return null on decryption failure
          }),
        );
      } else {
        return of(null); // or return of(undefined) based on your preference
      }
    } else {
      console.warn('Invalid key provided');
      return of(null); // or return of(undefined) based on your preference
    }
  }

  removeLocalData(key: string): Observable<boolean> {
    if (key) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        return of(true);
      } else {
        console.warn('No data found to remove for the provided key');
        return of(false);
      }
    } else {
      console.warn('Invalid key provided');
      return of(false);
    }
  }

  removeAllLocalData(): Observable<boolean> {
    try {
      localStorage.clear();
      return of(true);
    } catch (error) {
      this.toastr.error('Failed to clear local storage:');
      return of(false);
    }
  }
}
