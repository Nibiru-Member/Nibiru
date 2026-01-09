import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-index-analysis-dialog',
  templateUrl: './index-analysis-dialog.component.html',
  styleUrl: './index-analysis-dialog.component.css',
  imports: [AngularSvgIconModule, CommonModule],
})
export class IndexAnalysisDialogComponent implements OnInit {
  summary: any = null;
  indexDetails: any[] = [];
  recommendations: any = null;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<IndexAnalysisDialogComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.summary = this.data.summary || null;
      this.indexDetails = this.data.indexDetails || [];
      this.recommendations = this.data.recommendations || null;
      this.cdr.detectChanges();
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getRecommendationClass(recommendation: string): string {
    if (!recommendation) return '';
    const rec = recommendation.toLowerCase();
    if (rec.includes('rebuild')) return 'text-red-400';
    if (rec.includes('reorganize')) return 'text-yellow-400';
    return 'text-green-400';
  }

  getPriorityClass(priority: string): string {
    if (!priority) return '';
    const pri = priority.toLowerCase();
    if (pri === 'high') return 'bg-red-500/20 text-red-400';
    if (pri === 'medium') return 'bg-yellow-500/20 text-yellow-400';
    if (pri === 'low') return 'bg-blue-500/20 text-blue-400';
    return 'bg-gray-500/20 text-gray-400';
  }
}

