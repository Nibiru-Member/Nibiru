import { Component, inject, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  imports: [AngularSvgIconModule, CommonModule, ReactiveFormsModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.css',
})
export class ConfirmationComponent {
  statusControl = new FormControl(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ConfirmationComponent>) {}

  ngOnInit() {
    // Initialize selector only when required
    if (this.data.showStatusSelector) {
      this.statusControl.setValue(this.data.currentStatus !== undefined ? this.data.currentStatus : true);
    }
  }

  onSubmit() {
    if (this.data.showStatusSelector) {
      const value = this.statusControl.value;

      // Convert string to boolean
      const booleanValue = value === true || value === 'true';

      this.dialogRef.close(booleanValue);
      return;
    }

    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
