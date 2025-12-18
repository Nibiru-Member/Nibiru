import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, Validators, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { PasswordMatchValidator, PasswordValidator } from 'src/app/core/constants/pattern.constant';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';
import { UserService } from 'src/app/core/services/user/user.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgClass],
})
export class SignUpComponent implements OnInit {
  form!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  submitted = false;

  readonly _router = inject(Router);
  readonly _userService = inject(UserService);
  readonly _toast = inject(ToasterService);
  constructor() {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = new FormGroup(
      {
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required),
        company: new FormControl('', Validators.required),
        mobile: new FormControl('', Validators.required),
        userName: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, PasswordValidator.validate()]),
        confirm_password: new FormControl('', [Validators.required, PasswordValidator.validate()]),
        address: new FormControl('', Validators.required),
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

    const { email, password, userName, firstName, lastName, address, mobile, company } = this.form.value;

    const payload = {
      userName: userName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phoneNumber: mobile,
      companyName: company,
      address: address,
    };

    this._userService
      .saveAccountUserAndRoles(payload)
      .pipe(
        catchError((error) => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.statusCode < 400) {
          this._toast.success(res?.message);
          this._router.navigate(['/auth/sign-in']);
        } else {
          this._toast.error(res?.message);
        }
      });
  }
}
