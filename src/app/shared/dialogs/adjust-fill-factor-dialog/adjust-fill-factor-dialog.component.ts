import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AdjustThresholdDialogComponent } from '../adjust-threshold-dialog/adjust-threshold-dialog.component';
import { AngularSvgIconModule } from 'angular-svg-icon';

interface HistoryRecord {
  index: string;
  started: string;
  action: string;
  fragPercent: string;
  fillFactorPercent: string;
  fragChange: string;
}

@Component({
  selector: 'app-adjust-fill-factor-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './adjust-fill-factor-dialog.component.html',
  styleUrls: ['./adjust-fill-factor-dialog.component.css'],
})
export class AdjustFillFactorDialogComponent {
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AdjustThresholdDialogComponent>,
  ) {}

  historyData: HistoryRecord[] = [
    {
      index: 'Index 2',
      started: '08/10/2016 3:00:00AM',
      action: 'Rebuild Online',
      fragPercent: '64%',
      fillFactorPercent: '10%',
      fragChange: '-21.02',
    },
    {
      index: 'Index 3',
      started: '08/10/2016 3:00:00AM',
      action: 'Reorganize',
      fragPercent: '30%',
      fillFactorPercent: '30%',
      fragChange: '0',
    },
    {
      index: 'Index 4',
      started: '08/10/2016 3:00:00AM',
      action: '-',
      fragPercent: '14%',
      fillFactorPercent: '5%',
      fragChange: '-3',
    },
    {
      index: 'Index 5',
      started: '08/10/2016 3:00:00AM',
      action: '-',
      fragPercent: '30%',
      fillFactorPercent: '3%',
      fragChange: '47.32',
    },
  ];

  newValue: number | null = null;
  rebuildOnline: boolean = true;

  getFragChangeClass(fragChange: string): string {
    const value = parseFloat(fragChange);
    if (value < 0) {
      return 'text-red-400';
    } else if (value > 0) {
      return 'text-green-400';
    }
    return 'text-gray-300';
  }

  onSave(): void {
    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
