import { Component, EventEmitter, inject, Inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AccountProfileComponent } from './account-profile/account-profile.component';
import { AccountLicenceComponent } from './account-licence/account-licence.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AccountDetail } from 'src/app/core/models/account.model';
import { AccountService } from 'src/app/core/services/Account/account.service';
import { catchError, take } from 'rxjs/operators';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { EMPTY, firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
@Component({
  selector: 'app-add-edit-account',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, AccountProfileComponent, AccountLicenceComponent],
  templateUrl: './add-edit-account.component.html',
})
export class AddEditAccountComponent {
  @Output() accountSaved = new EventEmitter<{ success: boolean; accountId: string }>();
  @ViewChild('profileForm') profileForm!: NgForm;
  @ViewChild('licenseForm') licenseForm!: NgForm;
  private toast = inject(ToasterService);
  tabs = ['Account Profile', 'Account License'];
  activeTab = 0;
  isEditMode = false;

  accountData: {
    accountId?: string;
    profileData: any;
    licenseData: any;
  } = {
    profileData: {},
    licenseData: {},
  };

  accountId = '';
  isLoading = false;
  profileFormValid: boolean | null = true;
  licenseFormValid: boolean | null = true;
  UserId: string | null = null;
  UserProfilePic: { file: File; dataUrl: string } | null = null;
  base64Image: any;
  private activityLogger = inject(ActivityLoggerService);
  constructor(
    public dialogRef: MatDialogRef<AddEditAccountComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AccountDetail | null,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
  ) {
    this.isEditMode = !!data;
    if (this.isEditMode && data) {
      this.accountId = data.accountId;
    }
  }

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) {
      const parsed = JSON.parse(authUser);
      this.UserId = parsed.userId;
    } else {
      console.warn('No auth user found in localStorage');
    }
    if (this.accountId) {
      this.loadAccountData(this.accountId);
    }
  }

  captureProfileForm(form: NgForm) {
    this.profileForm = form;
  }

  captureLicenseForm(form: NgForm) {
    this.licenseForm = form;
  }
  onTabClick(tabIndex: number): void {
    // if creating new, disallow opening license tab without accountId
    if (!this.isEditMode && tabIndex === 1 && !this.accountId) {
      return;
    }
    this.activeTab = tabIndex;
  }
  loadAccountData(accountId: string): void {
    this.accountService
      .getAccountDetailById(accountId)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load account details');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res) {
          const account = res.data;
          if (account.profilePicture) {
            const prefix = account.profilePicture.startsWith('data:image') ? '' : 'data:image/png;base64,';
            this.base64Image = prefix + account.profilePicture;
          } else {
            this.base64Image = null;
          }
          this.accountData = {
            accountId: account.accountId,
            profileData: {
              companyName: account.companyName,
              email: account.email,
              phone1: account.phone1,
              phone2: account.phone2,
              website: account.website,
              aboutCompany: account.aboutCompany,
              fax: account.fax,
              tags: account.tags,
              profilePicture: this.base64Image, // ✅ Bound image for UI
            },
            licenseData: {
              licenseType: account.licenseType,
              licenseStartDate: account.licenseStartDate?.split('T')[0],
              licenseEndDate: account.licenseEndDate?.split('T')[0],
              noOfUsers: account.noOfUser,
              noOfInstances: account.noOfInstance,
              noOfDatabases: account.noOfDatabase,
              price: account.price,
            },
          };
          this.cdr.detectChanges();
        }
      });
  }

  onProfileUpdated(profileData: any): void {
    this.accountData.profileData = {
      ...this.accountData.profileData,
      ...profileData,
    };
  }

  onProfilePictureUploaded(uploadData: { file: File; dataUrl: string }): void {
    this.UserProfilePic = uploadData;
  }

  onLicenseUpdated(licenseData: any): void {
    this.accountData.licenseData = {
      ...this.accountData.licenseData,
      ...licenseData,
    };
  }

  validateProfileForm(): boolean {
    const required = ['companyName', 'phone1', 'aboutCompany', 'email', 'website'];
    return required.every((field) => !!this.accountData.profileData[field]);
  }

  validateLicenseForm(): boolean {
    const required = [
      'noOfUsers',
      'noOfInstances',
      'noOfDatabases',
      'licenseType',
      'licenseStartDate',
      'licenseEndDate',
      'price',
    ];
    return required.every((field) => {
      if (field.startsWith('noOf')) {
        return this.accountData.licenseData[field] > 0;
      }
      return !!this.accountData.licenseData[field];
    });
  }

  async nextStep(): Promise<void> {
    // Ensure profile form is available
    if (this.profileForm) {
      this.profileForm.control.markAllAsTouched();
      this.profileFormValid = !!this.profileForm.valid;
    }

    // Stop if form invalid → show validation messages
    if (!this.profileFormValid) {
      this.toast.error('Please fill all required profile fields.');
      return;
    }

    try {
      this.isLoading = true;

      if (this.isEditMode) {
        // Update existing account profile
        await this.updateAccountProfile();
      } else {
        // Create new account and upload pic
        await this.createAccountAndPicture();
      }

      // Move to License tab only when accountId exists
      if (this.accountId) {
        this.activeTab = 1;
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      this.toast.error('Failed to process profile step.');
    } finally {
      this.isLoading = false;
    }
  }

  async createAccountAndPicture(): Promise<void> {
    try {
      this.isLoading = true;
      const payload = {
        userId: this.UserId,
        companyName: this.accountData.profileData.companyName,
        email: this.accountData.profileData.email,
        phone1: this.accountData.profileData.phone1,
        website: this.accountData.profileData.website,
        aboutCompany: this.accountData.profileData.aboutCompany,
      };

      const response = await firstValueFrom(this.accountService.addAccount(payload));

      // Extract created accountId
      this.accountId = response?.data?.accountId || '';
      this.toast.success(response?.message ?? 'Account created successfully');

      // Upload picture if present
      if (this.accountId && this.UserProfilePic) {
        await this.uploadProfilePicture(this.UserProfilePic.file);
      }

      if (this.accountId) {
        this.activeTab = 1;
      }
    } catch (error: any) {
      this.toast.error('Failed to create account');
    } finally {
      this.isLoading = false;
    }
  }

  async updateAccountProfile(): Promise<void> {
    try {
      this.isLoading = true;
      const payload: any = {
        userId: this.UserId,
        accountId: this.accountId,
        companyName: this.accountData.profileData.companyName,
        email: this.accountData.profileData.email,
        phone1: this.accountData.profileData.phone1,
        website: this.accountData.profileData.website,
        aboutCompany: this.accountData.profileData.aboutCompany,
        phone2: this.accountData.profileData.phone2,
        tags: this.accountData.profileData.tags,
        fax: this.accountData.profileData.fax,
      };

      await firstValueFrom(this.accountService.updateAccount(payload));

      // SUCCESS LOG
      this.activityLogger.logUpdate('Account', `Account updated successfully.`, payload.accountId, true);

      if (this.UserProfilePic && this.accountId) {
        await this.uploadProfilePicture(this.UserProfilePic.file);
      }

      this.dialogRef.close({ success: true, accountId: this.accountId });
      this.accountSaved.emit({ success: true, accountId: this.accountId });
    } catch (error: any) {
      // FAILED LOG
      this.activityLogger.logUpdate(
        'Account',
        `Account update failed for ${this.accountData.profileData.companyName}`,
        this.accountId,
        false,
      );

      this.toast.error('Failed to update account');
    } finally {
      this.isLoading = false;
    }
  }

  async uploadProfilePicture(file: File): Promise<void> {
    if (!file || !this.accountId) return;

    try {
      this.isLoading = true;

      const formData = new FormData();
      formData.append('AccountId', this.accountId);
      formData.append('ProfilePicture', file);
      formData.append('UserId', this.UserId || '');
      formData.append('IsImageUpdate', 'true');

      await firstValueFrom(this.accountService.updateAccountProfile(formData).pipe(take(1)));

      // SUCCESS LOG
      this.activityLogger.logUpdate('Account', `Profile picture updated successfully.`, this.accountId, true);
    } catch (error) {
      // FAILED LOG
      this.activityLogger.logUpdate('Account', `Profile picture update failed`, this.accountId, false);

      this.toast.error('Error uploading profile picture');
    } finally {
      this.isLoading = false;
    }
  }

  async saveAccount(): Promise<void> {
    // Ensure license form is available
    if (this.licenseForm) {
      this.licenseForm.control.markAllAsTouched();
      this.licenseFormValid = !!this.licenseForm.valid;
    }

    // Stop if form invalid → show validation errors
    if (!this.licenseFormValid) {
      this.toast.error('Please fill all required license fields.');
      return;
    }

    try {
      this.isLoading = true;

      const payload: any = {
        userId: this.UserId,
        accountId: this.accountId,
        licenseKey: 'generate-or-get-from-response',
        licenseType: this.accountData.licenseData.licenseType,
        licenseStartDate: this.accountData.licenseData.licenseStartDate,
        licenseEndDate: this.accountData.licenseData.licenseEndDate,
        price: this.accountData.licenseData.price,
        noOfInstance: this.accountData.licenseData.noOfInstances,
        noOfUser: this.accountData.licenseData.noOfUsers,
        noOfDatabase: this.accountData.licenseData.noOfDatabases,
      };

      const response = await firstValueFrom(this.accountService.updateAccountLicense(payload));

      this.activityLogger.logUpdate('Account', `Account license updated.`, payload.accountId, true);

      this.toast.success(response?.message ?? 'License updated successfully');

      this.dialogRef.close({ success: true, accountId: this.accountId });
      this.accountSaved.emit({ success: true, accountId: this.accountId });
    } catch (error) {
      this.activityLogger.logUpdate('Account', `Account license update failed`, this.accountId, false);

      this.toast.error('Error updating account license');
    } finally {
      this.isLoading = false;
    }
  }

  previousStep(): void {
    if (this.activeTab > 0) {
      this.activeTab--;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
