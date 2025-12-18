import { Component, ElementRef, inject, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { catchError, EMPTY, take } from 'rxjs';

import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { UserRecord } from 'src/app/core/models/user.model';
import { environment } from 'src/environments/environment';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-add-edit-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSvgIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatOptionModule,
  ],
  templateUrl: './add-edit-user.component.html',
  styleUrls: ['./add-edit-user.component.css'],
})
export class AddEditUserComponent implements OnInit {
  apiUrl = environment.apiUrl;
  userForm!: FormGroup;
  submitted = false;

  roles: any[] = [];
  accounts: any[] = [];
  selectedFile: File | null = null;

  authUser: any;
  base64Image: string | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private toast = inject(ToasterService);
  private userService = inject(UserService);
  private activityLogger = inject(ActivityLoggerService);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddEditUserComponent>,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.authUser = JSON.parse(authUser);

    this.initForm();
    this.loadDropdownData();

    if (this.data?.id) {
      this.loadUserData(this.data.id);
    }
  }

  /** -----------------------------
   * Initialize Form
   * ----------------------------- */
  initForm(): void {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]*$/), Validators.maxLength(10)]],
      companyName: ['', Validators.required],
      address: ['', Validators.required],
      userRolesData: [[], Validators.required],
      accountId: ['', Validators.required],
      isActive: [true, Validators.required],
      userProfilePic: [null],
    });
  }

  /** -----------------------------
   * Trigger Upload
   * ----------------------------- */
  onUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.base64Image = reader.result as string;

      this.userForm.patchValue({ userProfilePic: this.base64Image });

      if (this.data?.id) {
        this.uploadProfilePicture(this.data.id, file);
      }
    };

    reader.readAsDataURL(file);
  }

  onReset(): void {
    this.selectedFile = null;
    this.base64Image = null;
    this.userForm.patchValue({ userProfilePic: null });
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  onRoleChange(event: any): void {
    const selectedRoles = this.userForm.value.userRolesData as string[];
    const value = event.target.value;

    if (event.target.checked) {
      selectedRoles.push(value);
    } else {
      const index = selectedRoles.indexOf(value);
      if (index !== -1) selectedRoles.splice(index, 1);
    }

    this.userForm.get('userRolesData')?.setValue([...selectedRoles]);
    this.userForm.get('userRolesData')?.updateValueAndValidity();
  }

  /** -----------------------------
   * Dropdown Data
   * ----------------------------- */
  loadDropdownData(): void {
    this.userService.getRoles().subscribe((res: any) => {
      setTimeout(() => {
        this.roles = res?.data ?? [];
      });
    });

    this.userService.getAccounts().subscribe((res: any) => {
      setTimeout(() => {
        this.accounts = res?.data ?? [];
      });
    });
  }

  /** -----------------------------
   * Load User For Edit
   * ----------------------------- */
  loadUserData(userId: string): void {
    this.userService
      .getUserRecordByUserId(userId)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load user details');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.data) {
          const user = res.data;

          this.base64Image = user.userProfilePic || null;

          this.userForm.patchValue({
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: user.base64Password,
            companyName: user.companyName,
            address: user.address,
            userRolesData: user.userRolesData?.map((r: any) => r.roleId) || [],
            accountId: user.accountId,
            isActive: user.isActive,
          });
        } else {
          this.toast.error('User details not found');
        }
      });
  }

  /** -----------------------------
   * Submit Handler
   * ----------------------------- */
  onSubmit(): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    if (this.data?.id) {
      this.updateUser();
    } else {
      this.addUser();
    }
  }

  /** -----------------------------
   * UPDATE USER
   * ----------------------------- */
  private updateUser(): void {
    const f = this.userForm.value;

    const payload: UserRecord = {
      userId: this.data.id,
      userName: f.userName,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      password: f.password,
      base64Password: f.password,
      phoneNumber: f.phoneNumber,
      companyName: f.companyName,
      address: f.address,
      accountId: f.accountId,
      userRolesData: f.userRolesData.map((r: string) => ({ roleId: r })),
      isActive: f.isActive,
      userProfilePic: this.selectedFile,
    };

    this.userService
      .updateUserRecord(payload)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to update user');
          this.activityLogger.logUpdate('User', 'User update failed', this.data.id, false);
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if ([200, 201].includes(res?.statusCode)) {
          this.toast.success('User updated successfully');

          this.activityLogger.logUpdate('User', 'User updated successfully', this.data.id, true);

          this.dialogRef.close('updated');
        } else {
          this.toast.error(res?.message || 'Failed to update user');
          this.activityLogger.logUpdate('User', 'User update failed', this.data.id, false);
        }
      });
  }

  /** -----------------------------
   * UPLOAD PROFILE PICTURE
   * ----------------------------- */
  uploadProfilePicture(userId: string, file: File): void {
    this.userService
      .updateUserProfilePicture(userId, file)
      .pipe(
        catchError(() => {
          this.toast.error('Profile picture upload failed');
          this.activityLogger.logUpdate('User', 'Profile picture update failed', userId, false);
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.statusCode === 200) {
          this.toast.success('Profile picture updated');
          this.activityLogger.logUpdate('User', 'Profile picture updated', userId, true);
        } else {
          this.toast.error(res?.message || 'Failed to upload');
          this.activityLogger.logUpdate('User', 'Profile picture update failed', userId, false);
        }
      });
  }

  /** -----------------------------
   * ADD USER
   * ----------------------------- */
  private addUser(): void {
    const f = this.userForm.value;

    const payload: UserRecord = {
      userId: '',
      userName: f.userName,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      password: f.password,
      base64Password: f.password,
      phoneNumber: f.phoneNumber,
      companyName: f.companyName,
      address: f.address,
      accountId: f.accountId,
      userRolesData: f.userRolesData.map((r: string) => ({ roleId: r })),
      isActive: f.isActive,
      userProfilePic: this.selectedFile,
    };

    this.userService
      .addUser(payload)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to add user');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if ([200, 201].includes(res?.statusCode)) {
          this.toast.success('User created successfully');

          this.dialogRef.close('created');
        } else {
          this.toast.error('Failed to create user');
        }
      });
  }

  /** -----------------------------
   * Toggle Status
   * ----------------------------- */
  toggleStatus(): void {
    const current = this.userForm.get('isActive')?.value;
    this.userForm.get('isActive')?.setValue(!current);
  }
  get f() {
    return this.userForm.controls;
  }

  /** -----------------------------
   * Close Dialog
   * ----------------------------- */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
