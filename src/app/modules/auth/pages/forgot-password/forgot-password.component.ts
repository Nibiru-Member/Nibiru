import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { catchError, EMPTY, take } from 'rxjs';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { UserService } from 'src/app/core/services/user/user.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  imports: [FormsModule, ReactiveFormsModule, RouterLink, ButtonComponent, AngularSvgIconModule, NgClass],
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  submitted = false;

  readonly _router = inject(Router);
  private _userService = inject(UserService);
  private _toast = inject(ToasterService);

  constructor() {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    const { email } = this.form.value;

    if (this.form.invalid) {
      return;
    }

    const payload = {
      email: email,
      url: location.origin + '/auth/reset-password',
    };

    this._userService
      .forgotPassword(payload)
      .pipe(
        catchError((error) => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          this._toast.success(res.message);
        } else {
          this._toast.error(res?.message);
        }
      });
  }
}
