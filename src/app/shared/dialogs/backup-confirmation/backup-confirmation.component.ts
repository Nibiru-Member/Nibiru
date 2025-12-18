import { Component, inject, Inject } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-backup-confirmation',
  imports: [AngularSvgIconModule],
  templateUrl: './backup-confirmation.component.html',
  styleUrl: './backup-confirmation.component.css',
})
export class BackupConfirmationComponent {
  private dialog = inject(MatDialog);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<BackupConfirmationComponent>) {}

  onRun(): void {
    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
