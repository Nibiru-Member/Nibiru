import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LicenseStatus {
  isValid: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  licenseType: string;
  licenseEndDate: string | null;
  status: string;
  upgradeUrl?: string;
  purchaseUrl?: string;
}

export interface LicenseValidationRequest {
  licenseKey: string;
  corporateEmail?: string;
  instanceName?: string;
  machineId?: string;
  ipAddress?: string;
}

export interface LicenseValidationResponse {
  isValid: boolean;
  message: string;
  license?: any;
  isExpiringSoon: boolean;
  daysRemaining: number;
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {
  private apiUrl = `${environment.apiUrl}/api/License`;

  constructor(private http: HttpClient) {}

  getLicenseStatus(accountId: string, corporateEmail?: string): Observable<any> {
    const params: any = { accountId };
    if (corporateEmail) {
      params.corporateEmail = corporateEmail;
    }
    return this.http.get<LicenseStatus>(`${this.apiUrl}/status`, { params });
  }

  validateLicense(request: LicenseValidationRequest): Observable<LicenseValidationResponse> {
    return this.http.post<LicenseValidationResponse>(`${this.apiUrl}/validate`, request);
  }

  registerInstance(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-instance`, request);
  }

  upgradeDemoLicense(licenseKey: string, upgradeToDays: number = 21): Observable<any> {
    return this.http.post(`${this.apiUrl}/upgrade-demo`, {
      licenseKey,
      upgradeToDays
    });
  }
}

