import { ChangeDetectorRef, Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogDefagBackupComponent } from './dialog-defag-backup/dialog-defag-backup.component';
import { DialogbackupListComponent } from 'src/app/modules/dashboard/pages/nft/dialogbackup-list/dialogbackup-list.component';
import { BackupConfirmationComponent } from 'src/app/shared/dialogs/backup-confirmation/backup-confirmation.component';
import { catchError, EMPTY, of, switchMap, take } from 'rxjs';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';

@Component({
  selector: 'app-defragment-policy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './defragment-policy.component.html',
  styleUrls: ['./defragment-policy.component.css'],
})
export class DefragmentPolicyComponent implements OnInit {
  // Inputs
  @Input() defragmentPolicy: any = null;
  @Input() serverConnection: any = null;

  @Input() isIndex: boolean = false;
  @Input() isMdf: boolean = false;
  @Input() isIndexMdf: boolean = false;

  @Input() isBackup: boolean = false;
  @Input() isAutomate: boolean = false;

  private dialog = inject(MatDialog);
  private server = inject(ServerService);
  private cdr = inject(ChangeDetectorRef);

  // Local properties for form data
  statisticsMethod: string = '';
  useNoRecompute: boolean = false;

  optimizeOption: string = '';
  updateStatistics: string = '';
  recompileProcedures: string = '';
  fillFactorCurrent: string = '';
  fillFactorNew: string = '';

  statisticsMethodEnabled: boolean = false;
  mdfFiles: Array<{ location: string; statusWithIndex?: string }> = [];
  location: string = '';
  statusWithIndex: string | null = null;
  
  // Backup path and type for display
  backupPath: string = '';
  backupType: 'PDF' | 'PDF + INDEX' | '' = '';

  constructor(public serverState: ServerStateService) {}

  ngOnInit(): void {
    // Initialize properties from defragmentPolicy if it exists (for edit mode)
    if (this.defragmentPolicy) {
      console.log('defragmentPolicy', this.defragmentPolicy);
      this.optimizeOption = this.defragmentPolicy.reorganize ? 'reorganize' : 
                            (this.defragmentPolicy.rebuild ? 'rebuild' : '');
      this.updateStatistics = this.defragmentPolicy.updateStatistics || this.updateStatistics || '';
      this.statisticsMethod = this.defragmentPolicy.statisticsMethod || '';
      this.recompileProcedures = this.defragmentPolicy.recompileProcedures || this.recompileProcedures || '';
      this.useNoRecompute = this.defragmentPolicy.useNoRecompute || false;
      this.isIndex = this.defragmentPolicy.isIndex || false;
      this.isMdf = this.defragmentPolicy.isMdf || false;
      this.isIndexMdf = this.defragmentPolicy.isIndexMdf || false;
      this.isBackup = this.defragmentPolicy.isBackup || false;
      this.isAutomate = this.defragmentPolicy.isAutomate || false;
      this.fillFactorCurrent = this.defragmentPolicy.fillFactorCurrent || this.fillFactorCurrent || '';
      this.fillFactorNew = this.defragmentPolicy.fillFactorNew || this.fillFactorNew || '';
      this.backupPath = this.defragmentPolicy.backupPath || '';
      
      // Set backup type based on PDF options
      if (this.isIndexMdf) {
        this.backupType = 'PDF + INDEX';
      } else if (this.isMdf) {
        this.backupType = 'PDF';
      }

      // Enable statistics method if updateStatistics requires it
      this.statisticsMethodEnabled = this.updateStatistics === 'before-analysis-refresh' || 
                                     this.updateStatistics === 'before-optimization';
    } else {
      // For new policy mode, enable statistics method based on current updateStatistics value
      this.statisticsMethodEnabled = this.updateStatistics === 'before-analysis-refresh' || 
                                     this.updateStatistics === 'before-optimization';
    }
  }

  // ---------------------------------------------
  // Event Handlers (unchanged)
  // ---------------------------------------------
  onOptimizeOptionChange(event: any) {
    this.optimizeOption = event.target.value;
    console.log('optimizeOption', this.optimizeOption);
  }

  onUpdateStatisticsChange(event: any) {
    const val = event.target.value;
    this.updateStatistics = val;

    this.statisticsMethodEnabled = val === 'before-analysis-refresh' || val === 'before-optimization';

    if (!this.statisticsMethodEnabled) {
      this.statisticsMethod = '';
    }
  }

  onRecompileProceduresChange(event: any) {
    this.recompileProcedures = event.target.value;
  }

  onFillFactorCurrentChange(event: any) {
    this.fillFactorCurrent = event.target.value;
  }

  onFillFactorNewChange(event: any) {
    this.fillFactorNew = event.target.value;
  }

  onIsAutomateChange(event: any) {
    const val = event.target.value === 'true' || event.target.value === true;
    this.isAutomate = val;
  }

  onIsIndexChange(event: any) {
    this.isIndex = event.target.checked;
  }

  onIsMdfChange(event: any) {
    const checked = event.target.checked;
    if (checked) {
      // When checking PDF, uncheck PDF + INDEX and show backup confirmation dialog
      this.isIndexMdf = false;
      this.showBackupConfirmationDialog('PDF');
    } else {
      // When unchecking PDF, also uncheck backup and clear backup info
      this.isMdf = false;
      this.backupPath = '';
      this.backupType = '';
      this.isBackup = false;
      this.cdr.detectChanges();
    }
  }

  onIsIndexMdfChange(event: any) {
    const checked = event.target.checked;
    if (checked) {
      // When checking PDF + INDEX, uncheck PDF and show backup confirmation dialog
      this.isMdf = false;
      this.showBackupConfirmationDialog('PDF + INDEX');
    } else {
      // When unchecking PDF + INDEX, also uncheck backup and clear backup info
      this.isIndexMdf = false;
      this.backupPath = '';
      this.backupType = '';
      this.isBackup = false;
      this.cdr.detectChanges();
    }
  }

  // Show backup confirmation dialog and handle the flow
  private showBackupConfirmationDialog(pdfType: 'PDF' | 'PDF + INDEX'): void {
    const confirmationDialogRef = this.dialog.open(BackupConfirmationComponent, {
      disableClose: true,
      width: '500px',
      data: {
        message: `Would you like to Backup the PDF file before defragmentation ?`,
      },
    });

    confirmationDialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        // User clicked Yes - open backup dialog
        this.openBackupDialog(pdfType);
      } else {
        // User clicked No or closed - uncheck the PDF option and backup checkbox
        if (pdfType === 'PDF') {
          this.isMdf = false;
        } else {
          this.isIndexMdf = false;
        }
        // Uncheck backup and clear backup info
        this.isBackup = false;
        this.backupPath = '';
        this.backupType = '';
        this.cdr.detectChanges();
      }
    });
  }

  // Open backup dialog and handle result
  private openBackupDialog(pdfType: 'PDF' | 'PDF + INDEX'): void {
    const backupDialogRef = this.dialog.open(DialogDefagBackupComponent, {
      disableClose: true,
      width: '560px',
      data: {
        pdfType: pdfType, // Pass PDF type to dialog
        isPolicyMode: true, // Flag to indicate this is for policy (not immediate execution)
        serverConnection: this.serverConnection
      },
    });

    backupDialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.backupPath) {
        // Backup dialog completed successfully - store backup path and type
        this.backupPath = result.backupPath;
        this.backupType = pdfType;
        // Check the backup checkbox since user confirmed backup
        this.isBackup = true;
        
        // Set the appropriate PDF flags
        if (pdfType === 'PDF') {
          this.isMdf = true;
          this.isIndexMdf = false;
        } else {
          this.isIndexMdf = true;
          this.isMdf = false;
        }
      } else {
        // User cancelled backup dialog - uncheck the PDF option and backup checkbox
        if (pdfType === 'PDF') {
          this.isMdf = false;
        } else {
          this.isIndexMdf = false;
        }
        // Uncheck backup and clear backup info
        this.isBackup = false;
        this.backupPath = '';
        this.backupType = '';
      }
      this.cdr.detectChanges();
    });
  }

  // ---------------------------------------------
  // Validation
  // ---------------------------------------------
  validate(): boolean {
    if (!this.optimizeOption) return false;

    if (this.fillFactorCurrent?.trim() !== '') {
      const c = Number(this.fillFactorCurrent);
      if (isNaN(c) || c < 0 || c > 100) return false;
    }

    if (this.fillFactorNew?.trim() !== '') {
      const n = Number(this.fillFactorNew);
      if (isNaN(n) || n < 0 || n > 100) return false;
    }

    return true;
  }

  getFormData() {
    const data = {
      isMdf: this.isMdf || false,
      isIndexMdf: this.isIndexMdf || false,
      isBackup: this.isBackup || false,
      backupPath: this.backupPath || '',
      reorganize: this.optimizeOption === 'reorganize' || false,
      rebuild: this.optimizeOption === 'rebuild' || false,
      isAutomate: this.isAutomate || false,
      isIndex: this.isIndex || false,
      updateStatistics: this.updateStatistics || '',
      recompileProcedures: this.recompileProcedures || '',
      statisticsMethod: this.statisticsMethod || '',
      useNoRecompute: this.useNoRecompute || false,
      fillFactorCurrent: this.fillFactorCurrent || '',
      fillFactorNew: this.fillFactorNew || '', 
    }
    return {
      optimizeOption: this.optimizeOption,
      updateStatistics: this.updateStatistics,
      statisticsMethod: this.statisticsMethod,
      useNoRecompute: this.useNoRecompute,
      recompileProcedures: this.recompileProcedures,
      fillFactorCurrent: this.fillFactorCurrent,
      fillFactorNew: this.fillFactorNew,
      isIndex: this.isIndex,
      isMdf: this.isMdf,
      isIndexMdf: this.isIndexMdf,
      isBackup: this.isBackup,
      isAutomate: this.isAutomate,
      backupPath: this.backupPath,
      backupType: this.backupType,
    };
  }

  // ---------------------------------------------
  // Backup Change Handler (DISABLED - Auto-controlled by PDF options)
  // ---------------------------------------------
  // Note: The backup checkbox is now disabled and automatically controlled
  // by the isMdf/isIndexMdf options. It gets checked when user confirms backup
  // and unchecked when user cancels or declines backup.
  onIsBackupChange(event: any) {
    // This function is kept for compatibility but the checkbox is disabled
    // The backup state is automatically managed by onIsMdfChange and onIsIndexMdfChange
  }
}
