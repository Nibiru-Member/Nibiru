import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogResourceCheckComponent } from './dialog-resource-check/dialog-resource-check.component';
import { AngularSvgIconModule } from 'angular-svg-icon';

interface ResourceCheckViewModel {
  checkId: string;
  checkName: string;
  comparisonOperator: string;
  thresholdOldValue: number;
  thresholdNewValue: number | null;
  isActive: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-resource-check',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './resource-check.component.html',
})
export class ResourceCheckComponent implements OnInit {
  @Input() policyId!: string;
  @Input() userId!: string;

  resourceChecks: ResourceCheckViewModel[] = [];

  constructor(private policyService: PolicyService, private cdr: ChangeDetectorRef, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadResourceChecks();
  }

  loadResourceChecks(): void {
    this.policyService.GetResourceCheckConfigList().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];

        this.resourceChecks = list.map((x: any) => ({
          checkId: x.checkId,
          checkName: x.checkName,
          comparisonOperator: x.comparisonOperator,
          thresholdOldValue: x.thresholdOldValue,
          thresholdNewValue: x.thresholdNewValue ?? 0,
          isActive: false,
          expanded: false,
        }));

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load resource checks', err),
    });
  }

  showDetails(item: ResourceCheckViewModel): void {
    const paramKey = this.mapCheckNameToParam(item.checkName);
    const dialogRef = this.dialog.open(DialogResourceCheckComponent, {
      data: {
        paramKey: paramKey,
        paramValue: item.thresholdOldValue,
      },
      panelClass: 'custom-dark-dialog',
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  // NEW: Map check names to API param keys
  mapCheckNameToParam(checkName: string): string {
    switch (checkName) {
      case 'Active session counts':
        return 'ActiveSessionCountThreshold';

      case 'Active transaction count':
        return 'ActiveTransactionCountThreshold';

      case 'CPU Load Percentage (SQL Instance)':
        return 'SQLInstanceCPUThreshold';

      case 'CPU load percentage':
        return 'TotalServerCPUThreshold';

      case 'Job count':
        return 'ExecutingJobCountThreshold';

      case 'Job name':
        return 'ExcludedJobName';

      case 'Memory usage percentage':
        return 'MemoryUsageThreshold';

      case 'Transaction log usage percentage':
        return 'TransactionLogUsageThreshold';

      case 'Users logged in':
        return 'UsersLoggedInThreshold';

      default:
        console.warn('No param mapping found for:', checkName);
        return '';
    }
  }
}
