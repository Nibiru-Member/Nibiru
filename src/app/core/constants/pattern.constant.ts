import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PasswordValidator {
  private pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,12}$/;

  static validate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // return null if there's no value (validating optional fields)
      }

      const isValid = new PasswordValidator().pattern.test(control.value);
      return isValid ? null : { invalidPassword: true };
    };
  }
}

export class UrlValidator {
  // Regular expression for validating a URL (basic URL validation)
  private pattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

  static validate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // return null if there's no value (validating optional fields)
      }

      const isValid = new UrlValidator().pattern.test(control.value);
      return isValid ? null : { invalidUrl: true };
    };
  }
}

export class PasswordMatchValidator {
  static match(password: string, confirmPassword: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Only clear the error if it exists
        if (confirmPasswordControl.hasError('passwordMismatch')) {
          confirmPasswordControl.setErrors(null);
        }
      }

      return null;
    };
  }
}
