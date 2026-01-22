import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LicenseService, LicenseStatus } from '../../../core/services/license/license.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-license-expiration-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './license-expiration-banner.component.html',
  styleUrls: ['./license-expiration-banner.component.css']
})
export class LicenseExpirationBannerComponent implements OnInit, OnDestroy {
  licenseStatus: LicenseStatus | null = null;
  showBanner = false;
  private subscription: Subscription = new Subscription();
  private checkInterval = interval(3600000); // Check every hour

  constructor(
    private licenseService: LicenseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLicenseStatus();
    
    // Check license status periodically
    this.subscription.add(
      this.checkInterval.subscribe(() => {
        this.checkLicenseStatus();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  checkLicenseStatus(): void {
    const user = this.authService.getUserDetail();
    if (!user || !user.accountId) {
      return;
    }

    this.licenseService.getLicenseStatus(user.accountId, user.email).subscribe({
      next: (status) => {
        this.licenseStatus = status;
        // Show banner if expiring soon (within 4 days) or expired
        this.showBanner = status.isExpiringSoon || !status.isValid;
      },
      error: (error) => {
        console.error('Error checking license status:', error);
      }
    });
  }

  onUpgrade(): void {
    if (this.licenseStatus?.upgradeUrl) {
      window.open(this.licenseStatus.upgradeUrl, '_blank');
    } else {
      this.router.navigate(['/upgrade']);
    }
  }

  onPurchase(): void {
    if (this.licenseStatus?.purchaseUrl) {
      window.open(this.licenseStatus.purchaseUrl, '_blank');
    } else {
      this.router.navigate(['/purchase']);
    }
  }

  dismissBanner(): void {
    this.showBanner = false;
  }

  getBannerClass(): string {
    if (!this.licenseStatus) return 'banner-info';
    
    if (!this.licenseStatus.isValid) {
      return 'banner-error';
    }
    
    if (this.licenseStatus.daysRemaining <= 1) {
      return 'banner-warning';
    }
    
    return 'banner-info';
  }

  getBannerMessage(): string {
    if (!this.licenseStatus) return '';

    if (!this.licenseStatus.isValid) {
      return `Your ${this.licenseStatus.licenseType} license has expired. Please renew to continue using the application.`;
    }

    if (this.licenseStatus.isExpiringSoon) {
      return `Your ${this.licenseStatus.licenseType} license will expire in ${this.licenseStatus.daysRemaining} day(s). Please renew to avoid service interruption.`;
    }

    return '';
  }
}

