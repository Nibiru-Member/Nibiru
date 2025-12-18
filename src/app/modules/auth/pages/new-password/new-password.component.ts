import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { catchError, EMPTY, take } from 'rxjs';
import { PasswordMatchValidator, PasswordValidator } from 'src/app/core/constants/pattern.constant';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.css'],
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgClass],
})
export class NewPasswordComponent implements OnInit {
  form!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;
  token: string = '';
  id: string = '';

  readonly _router = inject(Router);
  private _toast = inject(ToasterService);
  private _userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private encryption = inject(EncryptionService);

  constructor() {}

  ngOnInit(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const userId = queryParams.get('id');
    const token = queryParams.get('token');

    if (userId && token) {
      this.token = atob(token);
      this.id = atob(userId);
    }
    this.initForm();
  }

  // Token validation (example)
  validateToken(token: string): void {
    // You can implement the actual validation here (e.g., call an API)
    if (token === 'invalid_token') {
      // If the token is invalid, redirect to the error page
      this.router.navigate(['/errors/404']);
    }
  }

  initForm(): void {
    this.form = new FormGroup(
      {
        password: new FormControl('', [Validators.required, PasswordValidator.validate()]),
        confirm_password: new FormControl('', [Validators.required, PasswordValidator.validate()]),
      },
      {
        validators: PasswordMatchValidator.match('password', 'confirm_password'),
      },
    );
  }

  get f() {
    return this.form.controls;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const payload = {
      id: this.id,
      newPassword: this.form.value.password,
      token: this.token,
    };

    this._userService
      .changeUserPassword(payload)
      .pipe(
        catchError((error) => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.statusCode < 400) {
          this._toast.success(res?.message);

          // You can process sign-up logic here
          this._router.navigate(['/auth/sign-in']);
        } else {
          this._toast.error(res?.message);
        }
      });
  }
}
