import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ServerService } from 'src/app/core/services/server/server.service';

@Component({
  selector: 'app-dialogbackup-list',
  templateUrl: './dialogbackup-list.component.html',
  styleUrl: './dialogbackup-list.component.css',
  imports: [AngularSvgIconModule, CommonModule],
})
export class DialogbackupListComponent implements OnInit {
  listData: any[] = [];
  loading = true;
  /**
   * viewType to define table format
   * 0: Normal
   * 1: Only Backup Result
   * 2: Defragment with backup
   */
  viewType = 0;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<DialogbackupListComponent>,
    private policyService: ServerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadConditionList();
  }

  loadConditionList(): void {
    this.viewType = this.data.viewType
    if(this.viewType == 1) {
      this.listData = [this.data];
      this.cdr.detectChanges();
      console.log(this.data);
    }
    else {
      this.policyService.GetDefragmentationLogByLog(this.data.logId).subscribe({
        next: (res: any) => {
          this.listData = res?.data ? [res.data] : [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
