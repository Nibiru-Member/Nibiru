import { ChangeDetectorRef, Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogDefagBackupComponent } from './dialog-defag-backup/dialog-defag-backup.component';
import { DialogbackupListComponent } from 'src/app/modules/dashboard/pages/nft/dialogbackup-list/dialogbackup-list.component';
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
  @Input() optimizeOption: string = '';
  @Input() updateStatistics: string = '';
  @Input() recompileProcedures: string = '';
  @Input() statisticsMethod: string = '';
  @Input() useNoRecompute: boolean = false;

  @Input() fillFactorCurrent: string = '';
  @Input() fillFactorNew: string = '';

  @Input() isIndex: boolean = false;
  @Input() isMdf: boolean = false;
  @Input() isIndexMdf: boolean = false;

  @Input() isBackup: boolean = false;
  @Input() isAutomate: boolean = false;

  // Outputs
  @Output() isAutomateChange = new EventEmitter<boolean>();
  @Output() optimizeOptionChange = new EventEmitter<string>();
  @Output() updateStatisticsChange = new EventEmitter<string>();
  @Output() recompileProceduresChange = new EventEmitter<string>();
  @Output() fillFactorCurrentChange = new EventEmitter<string>();
  @Output() fillFactorNewChange = new EventEmitter<string>();

  @Output() isIndexChange = new EventEmitter<boolean>();
  @Output() isMdfChange = new EventEmitter<boolean>();
  @Output() isIndexMdfChange = new EventEmitter<boolean>();
  @Output() isBackupChange = new EventEmitter<boolean>();

  private dialog = inject(MatDialog);
  private server = inject(ServerService);
  private cdr = inject(ChangeDetectorRef);

  statisticsMethodEnabled: boolean = false;
  mdfFiles: Array<{ location: string }> = [];
  location: string = '';

  constructor(public serverState: ServerStateService) {}

  ngOnInit(): void {
    // MDF files will no longer load here.
    // They will load ONLY after database selection from the dialog.
  }

  // ---------------------------------------------
  // Event Handlers (unchanged)
  // ---------------------------------------------
  onOptimizeOptionChange(event: any) {
    this.optimizeOptionChange.emit(event.target.value);
  }

  onUpdateStatisticsChange(event: any) {
    const val = event.target.value;
    this.updateStatistics = val;
    this.updateStatisticsChange.emit(val);

    this.statisticsMethodEnabled = val === 'before-analysis-refresh' || val === 'before-optimization';

    if (!this.statisticsMethodEnabled) {
      this.statisticsMethod = '';
    }
  }

  onRecompileProceduresChange(event: any) {
    this.recompileProceduresChange.emit(event.target.value);
  }

  onFillFactorCurrentChange(event: any) {
    this.fillFactorCurrentChange.emit(event.target.value);
  }

  onFillFactorNewChange(event: any) {
    this.fillFactorNewChange.emit(event.target.value);
  }

  onIsAutomateChange(event: any) {
    const val = event.target.value === 'true' || event.target.value === true;
    this.isAutomate = val;
    this.isAutomateChange.emit(val);
  }

  onIsIndexChange(event: any) {
    this.isIndexChange.emit(event.target.checked);
  }

  onIsMdfChange(event: any) {
    this.isMdfChange.emit(event.target.checked);
  }

  onIsIndexMdfChange(event: any) {
    this.isIndexMdfChange.emit(event.target.checked);
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
    };
  }

  // ---------------------------------------------
  // Backup + MDF Defragmentation Flow (UPDATED)
  // ---------------------------------------------
  async onIsBackupChange(event: any) {
    const checked = !!event.target.checked;

    if (!checked) {
      this.isBackup = false;
      this.isBackupChange.emit(false);
      return;
    }

    const dialogRef = this.dialog.open(DialogDefagBackupComponent, {
      disableClose: true,
      width: '560px',
      data: {},
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (!result) {
            this.isBackup = false;
            this.isBackupChange.emit(false);
            return EMPTY;
          }

          const backupPath = result.backupPath;
          const databaseName = result.databaseName;

          if (!databaseName) {
            console.warn('Dialog did not return databaseName.');
            return EMPTY;
          }

          // 1. Load MDF files for the selected database
          return this.server.getTopFragmentedMdfFiles('Monthly', databaseName).pipe(
            switchMap((mdfRes: any) => {
              if (!mdfRes || !mdfRes.success) return EMPTY;

              this.mdfFiles = mdfRes.data.map((m: any) => ({
                location: m.location,
              }));

              if (this.mdfFiles.length > 0) {
                this.location = this.mdfFiles[0].location;
              }

              // 2. Now run defragment using the selected DB
              const payload = {
                databaseName: databaseName,
                mdfFilePath: this.location,
                backupPath: backupPath,
              };

              return this.server.DefragmentMDF(payload);
            }),
          );
        }),
      )
      .subscribe({
        next: (defragRes: any) => {
          const logId = defragRes?.data?.logId || (defragRes as any)?.logId || null;

          if (!logId) {
            console.warn('DefragmentMDF did not return logId.');
            return;
          }

          this.dialog.open(DialogbackupListComponent, {
            height: '400px',
            data: { logId: logId },
            panelClass: 'custom-dark-dialog',
          });

          this.isBackup = true;
          this.isBackupChange.emit(true);
        },
        error: (err) => {
          console.error('Defragment flow failed', err);
        },
      });
  }
}
