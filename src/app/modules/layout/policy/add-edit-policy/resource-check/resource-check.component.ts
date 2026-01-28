import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UpdatePolicyResource } from 'src/app/core/models/policy.model';

interface ResourceCheckViewModel {
  checkId: string;
  checkName: string;
  comparisonOperator: string;
  thresholdOldValue: number | string;
  isActive: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-resource-check',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, MatTooltipModule],
  templateUrl: './resource-check.component.html',
  styleUrls: ['./resource-check.component.css'],
})
export class ResourceCheckComponent implements OnInit {
  @Input() policyId!: string;
  @Input() userId!: string;

  resourceChecks: ResourceCheckViewModel[] = [];
  
  // Comparison operators dropdown options (standard operators for numeric comparisons)
  comparisonOperators: string[] = ['=', '!=', '>', '>=', '<', '<='];
  
  // Jobname specific operators
  jobnameOperators: string[] = ['Does Not Contain', 'Contains', 'EQ'];
  
  // Contention check options
  cancelPolicyOnDelay: boolean = false;
  delayTimeValue: number = 0;
  delayTimeUnit: 'minutes' | 'hours' | 'days' | 'never' = 'never';

  // Tooltip messages for each resource check
  tooltipMessages: { [key: string]: string } = {
    'Active session counts': 'Detect the number of active sessions running at the time the defragmentation operation is to run based on the "unit" specified.',
    'CPU Load Percentage (SQL Instance)': 'Detect the CPU utilization percentage of the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'Memory Usage percentage': 'Detect the memory utilization percentage of the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'Jobname': 'Detect the jobnames running on the SQL Server instance at the time the defragmentation operation is to run based on the "Jobname(s)" specified.',
    'Job count': 'Detect the number of jobs running on the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'Users logged in': 'Detect the number of users logged into the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'Active transaction count': 'Detect the active transaction count running on the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'Transaction log Usage percentage': 'Detect the transaction Log utilization percentage for the SQL Server instance at the time the defragmentation operation is to run based on the "unit" specified.',
    'CPU Load percentage': 'Detect the server CPU utilization percentage at the time the defragmentation operation is to run based on the "unit" specified.'
  };

  constructor(private policyService: PolicyService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadResourceChecks();
  }

  loadResourceChecks(): void {
    this.policyService.GetResourceCheckConfigList().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        // Map API data to our resource checks
        // If API doesn't return all required checks, initialize with default list
        const defaultChecks = [
          { checkName: 'Active session counts', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'CPU Load Percentage (SQL Instance)', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'Memory Usage percentage', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'Jobname', comparisonOperator: 'Does Not Contain', thresholdOldValue: '' },
          { checkName: 'Job count', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'Users logged in', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'Active transaction count', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'Transaction log Usage percentage', comparisonOperator: '>', thresholdOldValue: 0 },
          { checkName: 'CPU Load percentage', comparisonOperator: '>', thresholdOldValue: 0 }
        ];

        // Merge API data with defaults, prioritizing API data
        const apiCheckMap = new Map(list.map((x: any) => [x.checkName, x]));
        
        this.resourceChecks = defaultChecks.map((defaultCheck) => {
          const apiCheck: any = apiCheckMap.get(defaultCheck.checkName);
          return {
            checkId: apiCheck?.checkId || '',
            checkName: defaultCheck.checkName,
            comparisonOperator: apiCheck?.comparisonOperator || defaultCheck.comparisonOperator,
            thresholdOldValue: apiCheck?.thresholdOldValue ?? defaultCheck.thresholdOldValue,
            thresholdNewValue: apiCheck?.thresholdNewValue ?? null,
            isActive: false,
            expanded: false,
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load resource checks', err);
        // Initialize with default checks if API fails
        this.initializeDefaultChecks();
      },
    });
  }

  initializeDefaultChecks(): void {
    this.resourceChecks = [
      { checkId: '', checkName: 'Active session counts', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'CPU Load Percentage (SQL Instance)', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'Memory Usage percentage', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'Jobname', comparisonOperator: 'Does Not Contain', thresholdOldValue: '', isActive: false, expanded: false },
      { checkId: '', checkName: 'Job count', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'Users logged in', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'Active transaction count', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'Transaction log Usage percentage', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false },
      { checkId: '', checkName: 'CPU Load percentage', comparisonOperator: '>', thresholdOldValue: 0, isActive: false, expanded: false }
    ];
    this.cdr.detectChanges();
  }

  getTooltipMessage(checkName: string): string {
    let tooltipMessage = this.tooltipMessages[checkName] || '';
    if (checkName === 'Jobname') {
      tooltipMessage = tooltipMessage.replace('"Jobname(s)"', this.resourceChecks.find(x => x.checkName === checkName)?.thresholdOldValue?.toString() || '');
    } else {
      tooltipMessage = tooltipMessage.replace('"unit"', this.resourceChecks.find(x => x.checkName === checkName)?.thresholdOldValue?.toString() || '');
    }
    return tooltipMessage;
  }

  isJobnameCheck(checkName: string): boolean {
    return checkName === 'Jobname';
  }

  getOperatorsForCheck(checkName: string): string[] {
    if (checkName === 'Jobname') {
      return this.jobnameOperators;
    }
    return this.comparisonOperators;
  }

  onDelayTimeUnitChange(): void {
    if (this.delayTimeUnit === 'never') {
      this.cancelPolicyOnDelay = false;
      this.delayTimeValue = 0;
    }
  }

}
