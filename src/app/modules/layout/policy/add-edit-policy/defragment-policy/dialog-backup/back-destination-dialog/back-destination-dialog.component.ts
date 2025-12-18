import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';

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
    // here you can open your custom "browse folders" dialog
    // and set this.fileName from the result.
    // For now, just leave as a stub.
    console.log('Browse file clicked');
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
