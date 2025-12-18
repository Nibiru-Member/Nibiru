import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { Overlay } from '@angular/cdk/overlay';
import { BackDestinationDialogComponent } from '../dialog-backup/back-destination-dialog/back-destination-dialog.component';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of, take } from 'rxjs';
import { DialogbackupListComponent } from 'src/app/modules/dashboard/pages/nft/dialogbackup-list/dialogbackup-list.component';

@Component({
  selector: 'app-dialog-defag-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './dialog-defag-backup.component.html',
})
export class DialogDefagBackupComponent {
  private dialogRef = inject(MatDialogRef<DialogDefagBackupComponent>);
  private serverState = inject(ServerStateService);
  private serverApi = inject(ServerService);
  private toast = inject(ToasterService);
  private server = inject(ServerService);

  selectedUserId: any;
  servers: Array<{ serverName: string }> = [];
  databases: string[] = [];

  selectedServer = '';
  selectedDatabase = '';

  backupTypes = ['Full', 'Differential'];
  selectedBackupType = 'Full';

  backupDeviceType: 'Disk' | 'Url' = 'Disk';
  backupPath = '';

  destinations: { fullPath: string }[] = [];
  selectedDestinationIndex = -1;

  mdfFiles: Array<{ location: string }> = [];
  location: string = '';

  saving = false;
  authUser: any;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  // ----------------------------------------------------
  // INIT
  // ----------------------------------------------------
  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.authUser = JSON.parse(authUser);

    this.selectedUserId = this.authUser?.userId;
    this.loadServers();
  }

  // ----------------------------------------------------
  // LOAD SERVERS
  // ----------------------------------------------------
  loadServers() {
    if (!this.selectedUserId) return;

    this.serverApi.getUserServerList(this.selectedUserId).subscribe({
      next: (resp: any) => {
        this.servers = resp?.data || [];
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Unable to load server list.'),
    });
  }

  // ----------------------------------------------------
  // SERVER CHANGE → LOAD DATABASES
  // ----------------------------------------------------
  onServerChange() {
    this.databases = [];
    this.selectedDatabase = '';

    if (!this.selectedServer) return;

    const conn = this.serverState.getConnection();

    const payload: any = {
      server: this.selectedServer,
      username: conn?.username,
      password: conn?.password,
    };

    this.serverApi.getDatabases(payload).subscribe({
      next: (resp: any) => {
        this.databases = resp?.data?.databases || [];
      },
      error: () => this.toast.error('Unable to load database list.'),
    });
  }

  // ----------------------------------------------------
  // DATABASE CHANGE → LOAD MDF FILES
  // ----------------------------------------------------
  onDatabaseChange() {
    if (!this.selectedDatabase) return;
    this.loadMdfFilesForDatabase(this.selectedDatabase);
  }

  // ----------------------------------------------------
  // LOAD MDF FILES FOR SELECTED DATABASE
  // ----------------------------------------------------
  loadMdfFilesForDatabase(databaseName: string) {
    return this.server
      .getTopFragmentedMdfFiles('Monthly', databaseName)
      .pipe(
        catchError((err) => {
          console.error('MDF API error', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((mdfRes: any) => {
        if (mdfRes && mdfRes.success && Array.isArray(mdfRes.data)) {
          this.mdfFiles = mdfRes.data.map((m: any) => ({
            location: m.location,
          }));
          this.location = this.mdfFiles.length > 0 ? this.mdfFiles[0].location : '';
        } else {
          this.mdfFiles = [];
          this.location = '';
        }

        this.cdr.markForCheck();
      });
  }

  // ----------------------------------------------------
  // DESTINATION HANDLERS
  // ----------------------------------------------------
  onAddDestination() {
    if (!this.backupPath.trim()) {
      this.toast.error('Please enter a backup path.');
      return;
    }

    this.destinations.push({ fullPath: this.backupPath.trim() });
    this.selectedDestinationIndex = this.destinations.length - 1;
  }

  onRemoveDestination() {
    if (this.selectedDestinationIndex < 0) return;

    this.destinations.splice(this.selectedDestinationIndex, 1);
    this.selectedDestinationIndex = this.destinations.length ? 0 : -1;
  }

  onDestinationContents() {
    if (this.selectedDestinationIndex < 0) return;
    const dest = this.destinations[this.selectedDestinationIndex];
    this.toast.info(dest.fullPath);
  }

  openDestinationDialog() {
    const dialogRef = this.dialog.open(BackDestinationDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { fileName: this.backupPath, serverName: this.selectedServer, databaseName: this.selectedDatabase },
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(result, 'result');
      if (result) this.backupPath = result.backupPath;
      this.cdr.detectChanges();
    });
  }

  // ----------------------------------------------------
  // SAVE BACKUP
  // ----------------------------------------------------
  save() {
    if (!this.selectedServer || !this.selectedDatabase) {
      this.toast.error('Select server and database.');
      return;
    }

    const finalPath = this.destinations[this.selectedDestinationIndex]?.fullPath || this.backupPath;

    if (!finalPath) {
      this.toast.error('Provide backup destination.');
      return;
    }

    const backupPayload = {
      databaseName: this.selectedDatabase,
      backupPath: finalPath,
      backupType: this.selectedBackupType,
      backupDeviceType: this.backupDeviceType,
    };

    const defragPayload = {
      databaseName: this.selectedDatabase,
      backupPath: this.backupPath.trim(),
      mdfFilePath: this.location,
    };

    this.saving = true;

    // ----------------------------------------------------
    // STEP 1 — BACKUP DATABASE
    // ----------------------------------------------------
    this.serverApi.BackupDatabase(backupPayload).subscribe({
      next: (backupRes: any) => {
        if (backupRes.statusCode !== 200) {
          this.saving = false;
          this.toast.error(backupRes?.data?.message || 'Backup failed.');
          return;
        }

        this.toast.success(backupRes.data?.message || 'Backup successful.');

        // ----------------------------------------------------
        // STEP 2 — MDF DEFRAGMENT
        // ----------------------------------------------------
        this.serverApi.DefragmentMDF(defragPayload).subscribe({
          next: (defragRes: any) => {
            this.saving = false;

            if (defragRes.statusCode !== 200) {
              this.toast.error(defragRes?.data?.message || 'Defragment failed.');
              return;
            }

            this.toast.success(defragRes.data?.message || 'Defragment successful.');

            // ----------------------------------------------------
            // STEP 3 — EXTRACT logId FROM RESPONSE
            // ----------------------------------------------------
            const logId = defragRes?.data?.logId || defragRes?.logId || null;

            if (!logId) {
              console.warn('DefragmentMDF did not return logId.');
              return;
            }

            // ----------------------------------------------------
            // STEP 4 — OPEN LOG DIALOG
            // ----------------------------------------------------
            this.dialog.open(DialogbackupListComponent, {
              height: '400px',
              data: { logId: logId },
              panelClass: 'custom-dark-dialog',
            });
            // Close this dialog
            this.dialogRef.close(defragRes);
          },
          error: (err) => {
            this.saving = false;
            console.error('Defragment request failed', err);
            this.toast.error('Defragment request failed.');
          },
        });
      },

      error: (err) => {
        this.saving = false;
        console.error('Backup request failed', err);
        this.toast.error('Backup request failed.');
      },
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
