import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-rebuild-result-dialog',
  templateUrl: './rebuild-result-dialog.component.html',
  styleUrl: './rebuild-result-dialog.component.css',
  imports: [AngularSvgIconModule, CommonModule],
})
export class RebuildResultDialogComponent implements OnInit {
  summary: any = null;
  indexDetails: any[] = [];
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<RebuildResultDialogComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.summary = this.data.summary || null;
      this.indexDetails = this.data.indexDetails || [];
      this.cdr.detectChanges();
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getStatusClass(statusMessage: string): string {
    if (!statusMessage) return '';
    const status = statusMessage.toLowerCase();
    if (status.includes('success')) return 'text-green-400';
    if (status.includes('error') || status.includes('fail')) return 'text-red-400';
    if (status.includes('skip')) return 'text-yellow-400';
    return 'text-gray-400';
  }

  getResultTypeClass(resultType: string): string {
    if (!resultType) return '';
    const type = resultType.toLowerCase();
    if (type === 'error') return 'text-red-400';
    if (type === 'success') return 'text-green-400';
    return 'text-gray-400';
  }
}

