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

  selectedServer = '';

  backupTypes = ['Full', 'Differential'];
  selectedBackupType = 'Full';

  backupDeviceType: 'Disk' | 'Url' = 'Disk';
  backupPath = '';

  destinations: { fullPath: string }[] = [];
  selectedDestinationIndex = -1;
  
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
    
    // Check if serverConnection is provided (policy mode)
    if (this.data?.serverConnection) {
      this.selectedServer = this.data.serverConnection.server || '';
    } else {
      // Regular mode - load servers dropdown
      this.loadServers();
    }
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
  // SERVER CHANGE
  // ----------------------------------------------------
  onServerChange() {
    // Server changed - no database loading needed
    if (!this.selectedServer) return;
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
      data: { fileName: this.backupPath, serverName: this.selectedServer },
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.backupPath = result.backupPath;
      this.cdr.detectChanges();
    });
  }

  // ----------------------------------------------------
  // SAVE BACKUP
  // ----------------------------------------------------
  save() {
    if (!this.selectedServer) {
      this.toast.error('Select server.');
      return;
    }

    const finalPath = this.destinations[this.selectedDestinationIndex]?.fullPath || this.backupPath;

    if (!finalPath) {
      this.toast.error('Provide backup destination.');
      return;
    }

    // Return the backup configuration (policy mode)
    this.dialogRef.close({
      backupPath: finalPath,
      backupType: this.selectedBackupType,
      pdfType: this.data?.pdfType || 'PDF',
      destinations: this.destinations,
      selectedDestinationIndex: this.selectedDestinationIndex,
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
