import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LicenseService, LicenseStatus, LicenseValidationRequest } from 'src/app/core/services/license/license.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-licensing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licensing.component.html',
  styleUrls: ['./licensing.component.css'],
})
export class LicensingComponent implements OnInit {
  private licenseService = inject(LicenseService);
  private authService = inject(AuthService);
  private toast = inject(ToasterService);

  licenseKey = '';
  corporateEmail = '';
  instanceName = '';
  machineId = '';
  ipAddress = '';

  accountId: string | null = null;
  licenseStatus: LicenseStatus | null = null;
  isLoading = false;
  activationMessage = '';

  ngOnInit(): void {
    const user = this.authService.getUserDetail();
    if (!user) {
      this.toast.error('User information not found. Please sign in again.');
      return;
    }

    this.accountId = user.accountId || null;
    this.corporateEmail = user.email || '';
    this.instanceName = user.accountName || 'Primary Instance';

    if (this.accountId) {
      this.loadLicenseStatus();
    }
  }

  loadLicenseStatus(): void {
    if (!this.accountId) return;

    this.licenseService
      .getLicenseStatus(this.accountId, this.corporateEmail)
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Error loading license status', error);
          this.toast.error('Failed to load license status.');
          return EMPTY;
        }),
      )
      .subscribe((status) => {
        this.licenseStatus = status;
      });
  }

  activateLicense(): void {
    if (!this.licenseKey?.trim()) {
      this.toast.error('Please enter a license key.');
      return;
    }

    const request: LicenseValidationRequest = {
      licenseKey: this.licenseKey.trim(),
      corporateEmail: this.corporateEmail || undefined,
      instanceName: this.instanceName || 'Primary Instance',
      machineId: this.machineId || undefined,
      ipAddress: this.ipAddress || undefined,
    };

    this.isLoading = true;
    this.activationMessage = '';

    this.licenseService
      .validateLicense(request)
      .pipe(
        take(1),
        switchMap((response) => {
          if (!response?.isValid) {
            this.toast.error(response?.message || 'License validation failed.');
            this.isLoading = false;
            return EMPTY;
          }

          // Register instance after successful validation
          return this.licenseService
            .registerInstance({
              licenseKey: request.licenseKey,
              instanceName: request.instanceName,
              machineId: request.machineId,
              ipAddress: request.ipAddress,
              serverName: request.instanceName,
            })
            .pipe(
              take(1),
              catchError((error) => {
                console.error('Error registering license instance', error);
                this.toast.error('License validated, but instance registration failed.');
                this.isLoading = false;
                return EMPTY;
              }),
            );
        }),
        catchError((error) => {
          console.error('Error validating license', error);
          this.toast.error('Failed to validate license.');
          this.isLoading = false;
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.isLoading = false;
        this.activationMessage = 'License activated successfully.';
        this.toast.success('License activated successfully.');
        this.loadLicenseStatus();
      });
  }

  getStatusBadgeClass(): string {
    if (!this.licenseStatus) return 'bg-gray-700 text-gray-100';
    if (!this.licenseStatus.isValid) return 'bg-red-600 text-white';
    if (this.licenseStatus.isExpiringSoon) return 'bg-yellow-500 text-black';
    return 'bg-emerald-600 text-white';
  }
}


