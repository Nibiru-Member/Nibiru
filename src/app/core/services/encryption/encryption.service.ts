import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
import { CommonService } from '../common/common.service';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  secretKey = environment.encryptSecretKey;

  constructor(private commonService: CommonService) {}

  encrypt(data: any): Observable<string> {
    let newData = data;
    if (typeof data !== 'string') {
      newData = JSON.stringify(data);
    }
    const encryptedData = CryptoJS.AES.encrypt(newData, this.secretKey).toString();
    return of(encryptedData);
  }

  decrypt(data: string): Observable<any> {
    const decryptData = CryptoJS.AES.decrypt(data, this.secretKey).toString(CryptoJS.enc.Utf8);
    if (this.commonService.isValidJson(decryptData)) {
      return of(JSON.parse(decryptData));
    }
    return of(decryptData);
  }

  base64Key = environment.base64Key;

  base64ToBytes(base64: string): Uint8Array {
    const bytes = new Uint8Array([...atob(base64)].map((c) => c.charCodeAt(0)));
    return bytes;
  }

  bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async getCryptoKey(): Promise<CryptoKey> {
    const keyBytes = this.base64ToBytes(this.base64Key);
    return window.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  async encryptData(plainText: string): Promise<string> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = encoder.encode(plainText);
    const key = await this.getCryptoKey();

    const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedText);

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    // Separate tag (last 16 bytes) and ciphertext
    const tag = encryptedBytes.slice(encryptedBytes.length - 16);
    const cipherText = encryptedBytes.slice(0, encryptedBytes.length - 16);

    // Combine IV + tag + ciphertext
    const combined = new Uint8Array(iv.length + tag.length + cipherText.length);
    combined.set(iv, 0);
    combined.set(tag, iv.length);
    combined.set(cipherText, iv.length + tag.length);

    return this.bytesToBase64(combined);
  }

  async decryptResponse(encryptedBase64: string): Promise<string> {
    const rawData = this.base64ToBytes(encryptedBase64);
    const keyBytes = this.base64ToBytes(this.base64Key);
    const iv = rawData.slice(0, 12);
    const tag = rawData.slice(12, 28);
    const ciphertext = rawData.slice(28);

    const encryptedDataWithTag = new Uint8Array([...ciphertext, ...tag]);

    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not supported or available in this context.');
    }

    const cryptoKey = await window.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);

    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        cryptoKey,
        encryptedDataWithTag,
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      return decryptedText;
    } catch (error) {
      throw error;
    }
  }
}
