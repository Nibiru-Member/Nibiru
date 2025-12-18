import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PasswordValidator } from 'src/app/core/constants/pattern.constant';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { catchError, EMPTY, take } from 'rxjs';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgClass],
})
export class SignInComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  passwordTextType!: boolean;

  readonly _router = inject(Router);
  private _authService = inject(AuthService);
  private _toast = inject(ToasterService);

  constructor() {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, PasswordValidator.validate()]),
    });
  }

  get f() {
    return this.form.controls;
  }

  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.value;

    const payload = {
      usernameOrMobile: email,
      password: password,
    };

    this._authService
      .login(payload)
      .pipe(
        catchError((error) => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        console.log(res);
        if (res.statusCode < 400) {
          const userData = res.data;
          localStorage.setItem('authObj', JSON.stringify(userData));
          localStorage.setItem('bearerToken', userData?.token);
          localStorage.setItem('AutoDiscoveryOpened', 'false');
          this._toast.success(res.message);
          this._router.navigate(['/dashboard/admin']);
        } else {
          this._toast.error(res.message);
        }
      });
  }
}
