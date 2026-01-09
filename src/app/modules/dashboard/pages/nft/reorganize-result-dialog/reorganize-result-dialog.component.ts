import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-reorganize-result-dialog',
  templateUrl: './reorganize-result-dialog.component.html',
  styleUrl: './reorganize-result-dialog.component.css',
  imports: [AngularSvgIconModule, CommonModule],
})
export class ReorganizeResultDialogComponent implements OnInit {
  summary: any = null;
  indexDetails: any[] = [];
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ReorganizeResultDialogComponent>,
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

  getStatusClass(status: string): string {
    if (!status) return '';
    const stat = status.toLowerCase();
    if (stat.includes('success')) return 'text-green-400';
    if (stat.includes('error') || stat.includes('fail')) return 'text-red-400';
    return 'text-yellow-400';
  }

  getResultTypeClass(resultType: string): string {
    if (!resultType) return '';
    const type = resultType.toLowerCase();
    if (type === 'error') return 'text-red-400';
    if (type === 'success') return 'text-green-400';
    return 'text-gray-400';
  }
}

