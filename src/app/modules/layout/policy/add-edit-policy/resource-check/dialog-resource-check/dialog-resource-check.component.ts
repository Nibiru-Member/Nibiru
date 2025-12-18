import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';

@Component({
  selector: 'app-dialog-resource-check',
  templateUrl: './dialog-resource-check.component.html',
  styleUrls: ['./dialog-resource-check.component.css'],
  imports: [AngularSvgIconModule, CommonModule],
})
export class DialogResourceCheckComponent implements OnInit {
  listData: any[] = [];
  loading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<DialogResourceCheckComponent>,
    private policyService: PolicyService,
    private cdr: ChangeDetectorRef, // <-- ADD THIS
  ) {}

  ngOnInit(): void {
    console.log(this.data, 'dgh');

    this.loadConditionList();
  }

  loadConditionList(): void {
    this.policyService.CheckDynamicContentionConditions(this.data.paramKey, this.data.paramValue).subscribe({
      next: (res: any) => {
        this.listData = res?.data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
