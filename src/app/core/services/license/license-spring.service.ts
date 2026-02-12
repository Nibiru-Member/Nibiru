import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * LicenseSpring SDK Service
 * Handles client-side license activation, validation, and status checks
 * Documentation: https://docs.licensespring.com/online-licenses
 */

export interface LicenseSpringActivationRequest {
  licenseKey: string;
  machineId: string;
  instanceName: string;
}

export interface LicenseSpringActivationResponse {
  success: boolean;
  activationId?: string;
  message?: string;
}

export interface LicenseSpringStatus {
  isValid: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  remainingDays: number;
  maxActivations: number;
  currentActivations: number;
  status: string;
  message: string;
}

export interface LicenseSpringLicense {
  licenseKey: string;
  productCode: string;
  licenseType: 'trial' | 'paid';
  isTrial: boolean;
  expirationDate?: Date;
  trialDays?: number;
  maxActivations: number;
  currentActivations: number;
  status: string;
  customerEmail: string;
  createdAt: Date;
  lastValidatedAt?: Date;
  remainingDays: number;
  isExpiringSoon: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LicenseSpringService {
  private readonly apiUrl = `${environment.apiUrl}/api/License`;
  private readonly sdkKey: string = ''; // Will be loaded from environment or config

  constructor(private http: HttpClient) {
    // Load SDK key from environment or configuration
    // In production, this should come from environment variables
    this.sdkKey = (window as any).LICENSE_SPRING_SDK_KEY || '';
  }

  /**
   * Activate a license on the current device/instance
   * Uses LicenseSpring SDK for client-side activation
   */
  activateLicense(request: LicenseSpringActivationRequest): Observable<LicenseSpringActivationResponse> {
    return this.http.post<LicenseSpringActivationResponse>(
      `${this.apiUrl}/register-instance`,
      {
        licenseKey: request.licenseKey,
        machineId: request.machineId,
        instanceName: request.instanceName,
        ipAddress: this.getClientIpAddress()
      }
    );
  }

  /**
   * Validate license status
   * Checks license validity, expiration, and activation limits
   */
  validateLicense(licenseKey: string, corporateEmail?: string): Observable<LicenseSpringStatus> {
    return this.http.post<LicenseSpringStatus>(
      `${this.apiUrl}/validate`,
      {
        licenseKey,
        corporateEmail,
        ipAddress: this.getClientIpAddress()
      }
    );
  }

  /**
   * Get license status
   * Retrieves current license status including expiration and activation info
   */
  getLicenseStatus(accountId: string, corporateEmail?: string): Observable<LicenseSpringStatus> {
    const params: any = { accountId };
    if (corporateEmail) {
      params.corporateEmail = corporateEmail;
    }
    return this.http.get<LicenseSpringStatus>(`${this.apiUrl}/status`, { params });
  }

  /**
   * Deactivate license on current device
   * Frees up an activation slot
   */
  deactivateLicense(licenseKey: string, machineId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.apiUrl}/deactivate`,
      {
        licenseKey,
        machineId
      }
    );
  }

  /**
   * Get machine ID for current device
   * Generates a unique identifier for the current machine
   */
  getMachineId(): string {
    // Try to get from localStorage first
    let machineId = localStorage.getItem('license_machine_id');
    
    if (!machineId) {
      // Generate a unique machine ID based on browser fingerprint
      machineId = this.generateMachineId();
      localStorage.setItem('license_machine_id', machineId);
    }
    
    return machineId;
  }

  /**
   * Generate a unique machine ID based on browser fingerprint
   */
  private generateMachineId(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('LicenseSpring', 2, 2);
    const canvasFingerprint = canvas.toDataURL();

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvasFingerprint,
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `machine_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Get client IP address (if available)
   */
  private getClientIpAddress(): string {
    // This will be set by the backend from request headers
    // For client-side, we can't reliably get the IP
    return '';
  }

  /**
   * Check if license is valid and not expired
   */
  async checkLicenseValidity(licenseKey: string, corporateEmail?: string): Promise<boolean> {
    try {
      const status = await this.validateLicense(licenseKey, corporateEmail).toPromise();
      return status?.isValid === true && status?.isExpired === false;
    } catch (error) {
      console.error('License validation error:', error);
      return false;
    }
  }

  /**
   * Get remaining days until expiration
   */
  async getRemainingDays(licenseKey: string, corporateEmail?: string): Promise<number> {
    try {
      const status = await this.validateLicense(licenseKey, corporateEmail).toPromise();
      return status?.remainingDays || 0;
    } catch (error) {
      console.error('License status error:', error);
      return 0;
    }
  }

  /**
   * Check if license is expiring soon (within 4 days)
   */
  async isExpiringSoon(licenseKey: string, corporateEmail?: string): Promise<boolean> {
    try {
      const status = await this.validateLicense(licenseKey, corporateEmail).toPromise();
      return status?.isExpiringSoon === true;
    } catch (error) {
      console.error('License status error:', error);
      return false;
    }
  }
}

