import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-adjust-threshold-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './adjust-threshold-dialog.component.html',
  styleUrls: ['./adjust-threshold-dialog.component.css'],
})
export class AdjustThresholdDialogComponent {
  @Output() dialogClosed = new EventEmitter<void>();

  thresholdForm: FormGroup;
  currentFragmentation: number = 65;
  currentScanDensity: number = 75;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AdjustThresholdDialogComponent>,
  ) {
    this.thresholdForm = this.fb.group({
      fragmentation: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      scanDensity: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  onSubmit(): void {
    if (this.thresholdForm.valid) {
      this.closeDialog();
    } else {
      Object.keys(this.thresholdForm.controls).forEach((key) => {
        this.thresholdForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  prefillForm(): void {
    this.thresholdForm.patchValue({
      fragmentation: this.currentFragmentation,
      scanDensity: this.currentScanDensity,
    });
  }

  ngOnInit(): void {}
}
