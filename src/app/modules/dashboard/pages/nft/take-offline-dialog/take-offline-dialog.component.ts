import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';

interface CloseConnectionRow {
  databaseName: string;
  dropAll: boolean;
  status: string;
  message: string;
}

@Component({
  selector: 'app-take-offline-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './take-offline-dialog.component.html',
  styleUrl: './take-offline-dialog.component.css',
})
export class TakeOfflineDialogComponent {
  private dialogRef = inject(MatDialogRef<TakeOfflineDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private _serverService = inject(ServerService);
  private _toast = inject(ToasterService);
  private dialog = inject(MatDialog);
  uiDropAll = false;

  rows!: CloseConnectionRow;

  ngOnInit() {
    console.log(this.data);

    if (this.data) {
      this.checkDatabaseConnections();
    }
  }

  close() {
    this.dialogRef.close();
  }

  checkDatabaseConnections() {
    this._serverService
      .checkDatabaseConnections(this.data.mdfFiles)
      .pipe(
        catchError(() => EMPTY),
        take(1),
      )
      .subscribe((res: any) => {
        if (res.statusCode < 400) {
          console.log(res);
          this.rows = res.data;
          this.uiDropAll = this.rows.dropAll;
          this.cdr.detectChanges();
        } else {
          this._toast.error(res.message);
        }
      });
  }

  toggleTableOnlineStatus() {
    console.log('OK clicked, calling API...'); // <-- add this to see it in console

    const payload = {
      databaseName: this.data.mdfFiles,
      action: this.uiDropAll ? 'OFFLINE' : 'ONLINE',
    };

    console.log(payload);

    this._serverService
      .toggleTableOnlineStatus(payload)
      .pipe(
        catchError(() => EMPTY),
        take(1),
      )
      .subscribe((res: any) => {
        if (res.statusCode < 400) {
          console.log('API success', res);
          this.dialogRef.close(res);
        } else {
          this._toast.error(res.message);
        }
      });
  }
}
