import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { catchError, EMPTY, take } from 'rxjs';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { lowercaseFirstLetterKeys } from 'src/app/shared/utils/utils';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css',
})
export class ProfilePageComponent implements OnInit {
  userData!: AuthResponse;
  user: any = null;
  password: string = '';

  private userService = inject(UserService);
  private toaster = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private encryptionService = inject(EncryptionService);
  profileImage: any;

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) {
      this.userData = JSON.parse(authUser);
      this.getUserDataById(); // ✅ call only after userData is loaded
    } else {
      this.toaster.error('User not found in local storage');
    }
  }

  getUserDataById(): void {
    if (!this.userData?.userId) {
      this.toaster.error('User ID is missing');
      return;
    }

    this.userService
      .getUserRecordByUserId(this.userData.userId)
      .pipe(
        catchError((error: any) => {
          this.toaster.error('Failed to load user data');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.statusCode === 200 || res?.statusCode === 201) {
          this.user = res.data;
          this.password = res.data?.base64Password || '';
          this.profileImage = res.data?.userProfilePic;
          this.toaster.success(res.message || 'User data loaded');
        } else {
          this.toaster.error(res?.message || 'Failed to load user data');
        }

        // Ensure UI updates even in OnPush environments
        this.cdr.detectChanges();
      });
  }
}
