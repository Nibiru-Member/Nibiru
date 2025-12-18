import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-custom-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './custom-notifications.component.html',
  styleUrls: ['./custom-notifications.component.css'],
})
export class CustomNotificationsComponent {
  notificationForm: FormGroup;
  emailOptions: string[] = ['admin@example.com', 'user@example.com', 'support@example.com', 'alerts@example.com'];

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CustomNotificationsComponent>,
  ) {
    this.notificationForm = this.fb.group({
      alertName: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      email: ['', Validators.required],
      enableEmail: [true],
    });
  }

  toggleEmail(): void {
    const currentValue = this.notificationForm.get('enableEmail')?.value;
    this.notificationForm.patchValue({ enableEmail: !currentValue });
  }

  onSubmit(): void {
    if (this.notificationForm.valid) {
      // Handle form submission logic here
      this.closeDialog();
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.notificationForm.controls).forEach((key) => {
        this.notificationForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
