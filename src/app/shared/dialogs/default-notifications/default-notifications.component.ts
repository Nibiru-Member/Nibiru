import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomNotificationsComponent } from '../custom-notifications/custom-notifications.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-notifications',
  imports: [AngularSvgIconModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './default-notifications.component.html',
  styleUrl: './default-notifications.component.css',
})
export class DefaultNotificationsComponent {
  notificationForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<CustomNotificationsComponent>,
  ) {
    this.notificationForm = this.fb.group({
      indexName: ['', Validators.required],
      used: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }
  onSubmit(): void {
    if (this.notificationForm.valid) {
      this.closeDialog();
    } else {
      Object.keys(this.notificationForm.controls).forEach((key) => {
        this.notificationForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
