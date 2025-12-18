import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  private defaultOptions: Partial<IndividualConfig> = {
    timeOut: 1000,
    progressBar: true,
    progressAnimation: 'increasing',
    positionClass: 'toast-top-right',
  };

  constructor(private toaster: ToastrService) {}

  private showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    title?: string,
    options?: Partial<IndividualConfig>,
  ) {
    const toastOptions = { ...this.defaultOptions, ...options };
    this.toaster[type](message, title || '', toastOptions);
  }

  // --- Shortcut methods for convenience ---
  success(message: string, title?: string, options?: Partial<IndividualConfig>) {
    this.showToast('success', message, title, options);
  }

  error(message: string, title?: string, options?: Partial<IndividualConfig>) {
    this.showToast('error', message, title, options);
  }

  info(message: string, title?: string, options?: Partial<IndividualConfig>) {
    this.showToast('info', message, title, options);
  }

  warning(message: string, title?: string, options?: Partial<IndividualConfig>) {
    this.showToast('warning', message, title, options);
  }

  // --- Utility methods for custom positions ---
  successAtTopLeft(message: string, title?: string) {
    this.success(message, title, { positionClass: 'toast-top-left' });
  }

  successAtTopCenter(message: string, title?: string) {
    this.success(message, title, { positionClass: 'toast-top-center' });
  }

  successAtBottomRight(message: string, title?: string) {
    this.success(message, title, { positionClass: 'toast-bottom-right' });
  }

  // --- Custom durations ---
  sticky(message: string, title?: string, duration: number = 5000) {
    this.success(message, title, { timeOut: duration, disableTimeOut: true });
  }

  fast(message: string, title?: string, duration: number = 1000) {
    this.success(message, title, { timeOut: duration });
  }

  slow(message: string, title?: string, duration: number = 3000) {
    this.success(message, title, { timeOut: duration });
  }

  // --- Clear / remove ---
  clearAll() {
    this.toaster.clear();
  }
}
