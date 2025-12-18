import { ChangeDetectorRef, Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { BackDestinationDialogComponent } from './back-destination-dialog/back-destination-dialog.component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-dialog-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './dialog-backup.component.html',
})
export class DialogBackupComponent {
  private dialogRef = inject(MatDialogRef<DialogBackupComponent>);
  private serverState = inject(ServerStateService);
  private serverApi = inject(ServerService);
  private toast = inject(ToasterService);

  selectedUserId: any;
  servers: Array<{ serverName: string }> = [];
  databases: string[] = [];

  selectedServer = '';
  selectedDatabase = '';

  // drives / folders (you can still use them if needed)
  drives: any[] = [];
  folders: any[] = [];

  backupTypes = ['Full', 'Differential'];
  selectedBackupType = 'Full';

  // NEW: SSMS-style fields
  recoveryModel = 'FULL';
  copyOnly = false;
  backupComponent: 'Database' | 'Files' = 'Database';
  fileGroupName = '';

  backupDeviceType: 'Disk' | 'Url' = 'Disk';
  destinations: { fullPath: string }[] = [];
  selectedDestinationIndex = -1;

  backupPath = ''; // free text / helper path

  loadingServers = false;
  loadingDatabases = false;
  loadingDrives = false;
  loadingFolders = false;

  saving = false;
  errorMessage = '';

  authUser: any;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.authUser = JSON.parse(authUser);

    this.selectedUserId = this.authUser?.userId;

    // If parent passes server / database, preselect them
    if (this.data?.serverName) {
      this.selectedServer = this.data.serverName;
    }
    if (this.data?.mdfFiles) {
      this.selectedDatabase = this.data.mdfFiles;
    }

    if (this.data?.location) {
      this.backupPath = this.data.location;
    }

    console.log('Backup dialog data:', this.data);
  }

  ngAfterViewInit() {
    this.loadServers();
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  // --------------------------------------------------
  // SERVER LIST
  // --------------------------------------------------
  loadServers() {
    if (!this.selectedUserId) return;

    this.loadingServers = true;

    this.serverApi.getUserServerList(this.selectedUserId).subscribe({
      next: (resp: any) => {
        this.servers = resp?.data || [];
        this.loadingServers = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loadingServers = false;
        this.errorMessage = 'Unable to load server list';
        console.error(err);
      },
    });
  }

  // --------------------------------------------------
  // DATABASE LIST ON SERVER CHANGE
  // --------------------------------------------------
  onServerChange() {
    this.databases = [];
    this.selectedDatabase = '';
    this.resetDriveAndFolder();

    if (!this.selectedServer) return;

    const conn = this.serverState.getConnection();
    const data = {
      server: this.selectedServer,
      username: conn?.username || '',
      password: conn?.password || '',
    };

    this.loadingDatabases = true;

    this.serverApi.getDatabases(data).subscribe({
      next: (resp: any) => {
        this.databases = resp?.data?.databases || [];
        this.loadingDatabases = false;
      },
      error: (err) => {
        this.loadingDatabases = false;
        this.errorMessage = 'Unable to load databases for the selected server';
        console.error(err);
      },
    });
  }

  // --------------------------------------------------
  // DRIVE LIST FROM API (optional)
  // --------------------------------------------------
  loadDrives() {
    const conn = this.serverState.getConnection();
    if (!conn || !this.selectedServer) return;

    this.loadingDrives = true;

    this.serverApi.GetDiskDriveListForDropdown(this.selectedServer, conn.username, conn.password).subscribe({
      next: (resp: any) => {
        this.drives = resp?.data || [];
        this.loadingDrives = false;
      },
      error: (err) => {
        this.loadingDrives = false;
        this.errorMessage = 'Unable to load drives.';
        console.error(err);
      },
    });
  }

  onDriveChange() {
    this.folders = [];
    this.selectedFolder = '';
    this.backupPath = '';

    if (!this.selectedDrive) return;

    this.loadFolders();
  }

  // These two are left for compatibility; if you’re not
  // using drive/folder UI anymore, you can remove them.
  selectedDrive = '';
  selectedFolder = '';

  // --------------------------------------------------
  // FOLDER TREE FROM API (optional)
  // --------------------------------------------------
  loadFolders() {
    const conn = this.serverState.getConnection();
    if (!conn || !this.selectedDrive || !this.selectedServer) return;

    this.loadingFolders = true;

    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.selectedServer, conn.username, conn.password, this.selectedDrive)
      .subscribe({
        next: (resp: any) => {
          this.folders = resp?.data || [];
          this.loadingFolders = false;
        },
        error: (err) => {
          this.loadingFolders = false;
          this.errorMessage = 'Unable to load folders.';
          console.error(err);
        },
      });
  }

  onFolderChange() {
    this.updateBackupPath();
  }

  // --------------------------------------------------
  // PATH BUILDER (optional helper)
  // --------------------------------------------------
  updateBackupPath() {
    if (this.selectedDrive && this.selectedFolder) {
      this.backupPath = `${this.selectedFolder}\\`;
    }
  }

  // Reset dropdowns when server changes
  resetDriveAndFolder() {
    this.drives = [];
    this.folders = [];
    this.selectedDrive = '';
    this.selectedFolder = '';
    this.backupPath = '';
  }

  // --------------------------------------------------
  // DESTINATION LIST HANDLERS (Add / Remove / Contents)
  // --------------------------------------------------
  onAddDestination() {
    this.errorMessage = '';

    // if (!this.backupPath || !this.backupPath.trim()) {
    //   this.errorMessage = 'Please enter backup path before adding.';
    //   return;
    // }

    const path = this.backupPath.trim();
    this.destinations.push({ fullPath: path });
    this.selectedDestinationIndex = this.destinations.length - 1;
  }

  onRemoveDestination() {
    if (this.selectedDestinationIndex < 0) return;

    this.destinations.splice(this.selectedDestinationIndex, 1);
    this.selectedDestinationIndex = this.destinations.length > 0 ? this.destinations.length - 1 : -1;
  }

  onDestinationContents() {
    const dest = this.destinations[this.selectedDestinationIndex];
    if (!dest) return;

    this.toast.info(dest.fullPath);
  }

  // --------------------------------------------------
  // SAVE BACKUP
  // --------------------------------------------------
  save() {
    this.errorMessage = '';

    // if (!this.selectedServer) {
    //   this.errorMessage = 'Please select a server.';
    //   return;
    // }

    // if (!this.selectedDatabase) {
    //   this.errorMessage = 'Please select a database.';
    //   return;
    // }

    // Prefer selected destination, fallback to raw backupPath
    let finalPath: string | null = null;

    if (this.selectedDestinationIndex >= 0 && this.destinations[this.selectedDestinationIndex]) {
      finalPath = this.destinations[this.selectedDestinationIndex].fullPath;
    } else if (this.backupPath && this.backupPath.trim()) {
      finalPath = this.backupPath.trim();
    }

    // if (!finalPath) {
    //   this.errorMessage = 'Please specify backup destination path.';
    //   return;
    // }

    // if (!finalPath.toLowerCase().endsWith('.bak')) {
    //   this.errorMessage = '.bak extension is required.';
    //   return;
    // }

    const payload: any = {
      databaseName: this.selectedDatabase,
      backupPath: finalPath,
      backupType: this.selectedBackupType,
      // these extra fields are available if API wants them later:
      recoveryModel: this.recoveryModel,
      copyOnly: this.copyOnly,
      backupComponent: this.backupComponent,
      fileGroupName: this.fileGroupName || null,
      backupDeviceType: this.backupDeviceType,
    };

    this.saving = true;

    this.serverApi.BackupDatabase(payload).subscribe({
      next: (resp) => {
        this.saving = false;
        if (resp.statusCode === 200 && resp.data) {
          this.toast.success(resp.data.message);
          this.dialogRef.close(resp);
        } else {
          this.toast.error(resp?.data?.message || 'Backup failed.');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.message || 'Failed Backup');
      },
    });
  }

  openDestinationDialog() {
    const dialogRef = this.dialog.open(BackDestinationDialogComponent, {
      width: '520px',
      disableClose: true,
      data: { fileName: this.backupPath }, // optional
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.fileName) {
        this.backupPath = result.fileName; // or wherever you store it
      }
    });
  }
}
