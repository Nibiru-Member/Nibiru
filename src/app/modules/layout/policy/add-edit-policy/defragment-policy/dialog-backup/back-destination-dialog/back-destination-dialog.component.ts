import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
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
    // Use setTimeout to defer loadDrives to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadDrives();
    }, 0);
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
    this.cdr.detectChanges();
    console.log(this.selectedDrive, 'selectedDrive');
    this.serverApi
      .GetBasicDriveFolderTreeForDropdown(this.selectServer, conn.username, conn.password, this.selectedDrive)
      .subscribe({
        next: (resp: any) => {
          this.folders = resp?.data || [];
          this.loadingFolders = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loadingFolders = false;
          this.errorMessage = 'Unable to load folders.';
          this.cdr.detectChanges();
          console.error(err);
        },
      });
  }

  loadDrives() {
    const conn = this.serverState.getConnection();
    if (!conn) return;

    this.loadingDrives = true;
    this.cdr.detectChanges();
    this.serverApi.GetDiskDriveListForDropdown(this.selectServer, conn.username, conn.password).subscribe({
      next: (resp: any) => {
        this.drives = resp?.data || [];
        this.loadingDrives = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingDrives = false;
        this.errorMessage = 'Unable to load drives.';
        this.cdr.detectChanges();
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
      console.log('FileBrowserDialog closed, result received:', result);
      console.log('Current backupPath before update:', this.backupPath);
      
      // Handle result - check both result.fileName and direct result string
      let filePath = '';
      if (result) {
        if (typeof result === 'string') {
          filePath = result;
        } else if (result.fileName) {
          filePath = result.fileName;
        }
      }
      
      if (filePath) {
        console.log('Setting backupPath to:', filePath);
        
        // Copy the selected path to the File name field (backupPath)
        this.backupPath = filePath;
        this.fileName = filePath;
        this.errorMessage = '';
        
        console.log('backupPath after assignment:', this.backupPath);
        
        // Update drive and folder if path is set (optional - for UI consistency)
        if (this.backupPath) {
          const pathParts = this.backupPath.split('\\');
          if (pathParts.length > 0 && pathParts[0]) {
            const drivePart = pathParts[0];
            // Extract drive letter (e.g., "C:" or "C:\")
            const driveMatch = drivePart.match(/^([A-Za-z]):/);
            if (driveMatch) {
              this.selectedDrive = driveMatch[1] + ':';
            }
          }
        }
        
        // Force change detection immediately
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        
        // Also trigger in next tick to ensure UI updates
        setTimeout(() => {
          this.cdr.detectChanges();
          console.log('Change detection triggered after timeout, backupPath:', this.backupPath);
        }, 10);
      } else {
        console.log('Dialog closed without valid file path. Result:', result);
      }
    });
  }

  save() {
    this.errorMessage = '';
    const cleanPath = this.backupPath.trim();
    
    // Validation: Check if path is provided
    if (!cleanPath) {
      this.errorMessage = 'Please select a backup path.';
      return;
    }
    
    // Validation: Check file extension (.bak or .tm)
    const lowerPath = cleanPath.toLowerCase();
    if (!lowerPath.endsWith('.bak') && !lowerPath.endsWith('.tm')) {
      this.errorMessage = 'File extension must be .bak or .tm';
      return;
    }
    
    const payload: any = {
      databaseName: this.selectedDatabase,
      backupPath: cleanPath,
      server: this.selectServer,
    };
    console.log('BackDestinationDialog closing with payload:', payload);
    this.dialogRef.close(payload);
  }
}
