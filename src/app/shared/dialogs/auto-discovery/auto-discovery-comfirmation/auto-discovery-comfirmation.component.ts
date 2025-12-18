import { Component, inject, Inject } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AutoDiscoveryComponent } from '../auto-discovery.component';
import { ServerComponent } from '../../server/server.component';

@Component({
  selector: 'app-auto-discovery-comfirmation',
  imports: [AngularSvgIconModule],
  templateUrl: './auto-discovery-comfirmation.component.html',
  styleUrl: './auto-discovery-comfirmation.component.css',
})
export class AutoDiscoveryComfirmationComponent {
  private dialog = inject(MatDialog);
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AutoDiscoveryComfirmationComponent>,
  ) {}
  onRun(): void {
    const dialogRef = this.dialog.open(AutoDiscoveryComponent, {
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(() => {});
    this.dialogRef.close();
  }
  closeDialog() {
    const dialogRef = this.dialog.open(ServerComponent, {
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(() => {});
    this.dialogRef.close();
  }
}
