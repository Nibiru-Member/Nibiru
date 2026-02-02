import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UpdatePolicyResource } from 'src/app/core/models/policy.model';
import { ResourceCheckConfig } from 'src/app/core/models/policy.model';

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

  resourceChecks: ResourceCheckConfig[] = [];
  
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
    // If policyId is available, load from backend; otherwise use defaults
    if (this.policyId && this.policyId !== '') {
      this.policyService.getPolicyResourceConfig(this.policyId).subscribe({
        next: (response: any) => {
          if (response?.data) {
            const data = response.data;
            
            // Load delay settings
            if (data.delayTimeValue !== null && data.delayTimeValue !== undefined) {
              this.delayTimeValue = data.delayTimeValue;
            }
            if (data.delayTimeUnit) {
              this.delayTimeUnit = data.delayTimeUnit;
            }

            // Load resource checks if available
            if (data.checks && data.checks.length > 0) {
              this.resourceChecks = data.checks.map((check: any) => ({
                checkName: check.checkName,
                comparisonOperator: check.comparisonOperator,
                value: check.value !== null && check.value !== undefined ? (this.isJobnameCheck(check.checkName) ? check.value : Number(check.value) || 0) : (this.isJobnameCheck(check.checkName) ? '' : 0),
                isActive: check.isActive || false
              }));
            } else {
              // If no checks found, initialize with defaults
              this.initializeDefaultChecks();
            }
          } else {
            // If no data, initialize with defaults
            this.initializeDefaultChecks();
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading resource checks:', error);
          // On error, initialize with defaults
          this.initializeDefaultChecks();
        }
      });
    } else {
      // No policyId, initialize with defaults
      this.initializeDefaultChecks();
    }
  }

  initializeDefaultChecks(): void {
    this.resourceChecks = [
      { checkName: 'Active session counts', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'CPU Load Percentage (SQL Instance)', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'Memory Usage percentage', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'Jobname', comparisonOperator: 'Does Not Contain', value: '', isActive: false },
      { checkName: 'Job count', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'Users logged in', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'Active transaction count', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'Transaction log Usage percentage', comparisonOperator: '>', value: 0, isActive: false },
      { checkName: 'CPU Load percentage', comparisonOperator: '>', value: 0, isActive: false }
    ];
    this.cdr.detectChanges();
  }

  getTooltipMessage(checkName: string): string {
    let tooltipMessage = this.tooltipMessages[checkName] || '';
    if (checkName === 'Jobname') {
      tooltipMessage = tooltipMessage.replace('"Jobname(s)"', this.resourceChecks.find(x => x.checkName === checkName)?.value?.toString() || '');
    } else {
      tooltipMessage = tooltipMessage.replace('"unit"', this.resourceChecks.find(x => x.checkName === checkName)?.value?.toString() || '');
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

  getFormData(): UpdatePolicyResource {
    // Convert checks array, ensuring value is always a string
    const checks = this.resourceChecks.map(check => ({
      checkName: check.checkName,
      comparisonOperator: check.comparisonOperator,
      value: check.value !== null && check.value !== undefined ? String(check.value) : '',
      isActive: check.isActive
    }));
    
    return {
      userId: this.userId,
      policyId: this.policyId,
      checks: checks,
      delayTimeValue: this.delayTimeValue,
      delayTimeUnit: this.delayTimeUnit
    };
  }

}
