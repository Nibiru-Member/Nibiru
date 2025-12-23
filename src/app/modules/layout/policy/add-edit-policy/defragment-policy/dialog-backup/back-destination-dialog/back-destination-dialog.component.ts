import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { FileBrowserDialogComponent } from '../file-browser-dialog/file-browser-dialog.component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-back-destination-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './back-destination-dialog.component.html',
  styleUrl: './back-destination-dialog.component.css',
})
export class BackDestinationDialogComponent {
  private dialogRef = inject(MatDialogRef<BackDestinationDialogComponent>);
  private serverState = inject(ServerStateService);
  private serverApi = inject(ServerService);
  private toast = inject(ToasterService);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  backupPath = ''; // free text / helper path
  loadingDrives = false;
  loadingFolders = false;
  saving = false;
  drives: any = [];
  folders: any = [];
  // 'file' | 'device' but we only support 'file' like SSMS default
  selectedMode: 'file' = 'file';

  fileName = '';
  backupTypes = ['Full', 'Differential'];
  selectedBackupType = 'Full';
  selectServer = '';
  ngOnInit() {
    this.selectServer = this.data.serverName;
    this.selectedDatabase = this.data.databaseName;
    this.loadDrives();
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
  selectedDatabase: string = '';
  errorMessage = '';

  // --------------------------------------------------
  // FOLDER TREE FROM API (optional)
  // --------------------------------------------------
  loadFolders() {
    const conn = this.serverState.getConnection();
    if (!conn || !this.selectedDrive || !this.selectServer) return;

    this.loadingFolders = true;
    console.log(this.selectedDrive, 'selectedDrive');
    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.selectServer, conn.username, conn.password, this.selectedDrive)
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

  loadDrives() {
    const conn = this.serverState.getConnection();
    if (!conn) return;

    this.loadingDrives = true;
    this.serverApi.GetDiskDriveListForDropdown(this.selectServer, conn.username, conn.password).subscribe({
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

  onFolderChange() {
    this.updateBackupPath();
  }

  updateBackupPath() {
    if (this.selectedDrive && this.selectedFolder) {
      this.backupPath = `${this.selectedFolder}\\`;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  browseFile() {
    const dialogRef = this.dialog.open(FileBrowserDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
      disableClose: true,
      data: {
        serverName: this.selectServer,
        databaseName: this.selectedDatabase,
        initialPath: this.backupPath || (this.selectedDrive && this.selectedFolder ? `${this.selectedFolder}\\` : ''),
      },
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.fileName) {
        this.backupPath = result.fileName;
        // Update drive and folder if path is set
        if (this.backupPath) {
          const pathParts = this.backupPath.split('\\');
          if (pathParts.length > 0) {
            const driveLetter = pathParts[0].charAt(0);
            this.selectedDrive = driveLetter;
            this.onDriveChange();
          }
        }
      }
    });
  }

  save() {
    this.errorMessage = '';
    const cleanPath = this.backupPath.trim().toLowerCase();
    if (!cleanPath.endsWith('.bak')) {
      this.errorMessage = '.bak extension is required.';
      return;
    }
    const payload: any = {
      databaseName: this.selectedDatabase,
      backupPath: this.backupPath.trim(),
      server: this.selectServer,
    };
    console.log(payload, 'updated Payload');
    this.dialogRef.close(payload);
  }
}
