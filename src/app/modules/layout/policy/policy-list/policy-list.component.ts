import { ChangeDetectorRef, Component, HostListener, inject, NgZone, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { PolicyDetail } from 'src/app/core/models/policy.model';
import { AddEditPolicyComponent } from '../add-edit-policy/add-edit-policy.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, MatTooltipModule, FormsModule],
  templateUrl: './policy-list.component.html',
  styleUrls: ['./policy-list.component.css'],
})
export class PolicyListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private policyService = inject(PolicyService);

  policies: PolicyDetail[] = [];
  expandedPolicyId: string | null = null;
  isLoading = false;

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;
  paginationPages: number[] = [];

  // Search
  searchText = '';
  private searchTimer: any;

  ownwerName: any;

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) {
      const parsed = JSON.parse(authUser);
      this.ownwerName = parsed.userName;
    }
    this.getPolicies();
  }

  /** Getter for End Record */
  get endRecord() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  getActiveDays(policy: any): string {
    const dayMap = [
      { key: 'onSunday', label: 'Sunday' },
      { key: 'onMonday', label: 'Monday' },
      { key: 'onTuesday', label: 'Tuesday' },
      { key: 'onWednesday', label: 'Wednesday' },
      { key: 'onThursday', label: 'Thursday' },
      { key: 'onFriday', label: 'Friday' },
      { key: 'onSaturday', label: 'Saturday' },
    ];

    const activeDays = dayMap.filter((d) => policy[d.key] === true).map((d) => d.label);

    return activeDays.length > 0 ? activeDays.join(', ') : 'No days selected';
  }

  /** Pagination Builder */
  updatePaginationPages() {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let start = Math.max(1, this.page - 2);
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);

    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - (maxPagesToShow - 1));
    }

    for (let p = start; p <= end; p++) pages.push(p);

    this.paginationPages = pages;
  }

  /** Navigate */
  goToFirst() {
    if (this.page !== 1) {
      this.page = 1;
      this.getPolicies();
    }
  }

  goToLast() {
    if (this.page !== this.totalPages) {
      this.page = this.totalPages;
      this.getPolicies();
    }
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.getPolicies();
    }
  }

  /** Fetch from API */
  getPolicies(): void {
    this.isLoading = true;

    this.policyService.getPolicyDetailList(this.page, this.pageSize, this.searchText || '').subscribe({
      next: (res) => {
        this.policies = res?.data || [];
        this.totalRecords = this.policies.length || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        this.updatePaginationPages();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load policies');
        this.isLoading = false;
      },
    });
  }

  /** Expand Row */
  toggleExpand(id: string): void {
    this.expandedPolicyId = this.expandedPolicyId === id ? null : id;
  }

  /** Add / Edit Policy */
  onAddEditPolicy(policyId?: string): void {
    const dialogRef = this.dialog.open(AddEditPolicyComponent, {
      width: '950px',
      disableClose: true,
      data: policyId ? { policyId } : null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.toast.success('Policy saved successfully!');
        this.ngZone.run(() => {
          this.getPolicies();
        });
      }
    });
  }

  /** Debounced Search (API-based) */
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.getPolicies();
    }, 300);
  }

  /** Export CSV (server-driven list only) */
  exportPoliciesCSV() {
    if (!this.policies.length) {
      this.toast.error('No data to export');
      return;
    }

    const excluded = ['categoryId', 'ownerId', 'policyId'];
    const header = Object.keys(this.policies[0]).filter((k) => !excluded.includes(k));

    const rows = this.policies.map((obj) => header.map((key) => escapeCsv((obj as any)[key])).join(','));

    const csv = [header.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `policies_${Date.now()}.csv`;
    link.click();
  }

  /** Status Badge */
  getStatusClass(isActive: boolean): string {
    return isActive
      ? 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
      : 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
  }

  /** Update Status */
  onPolicyUpdate(id: any) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'UPDATE POLICY STATUS',
        cancelText: 'CANCEL',
        submitText: 'UPDATE',
        showStatusSelector: true,
        currentStatus: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== null && result !== undefined) {
        const status = result === true || result === 'true';
        this.updatePolicyStatus(id, status);
      }
    });
  }

  updatePolicyStatus(policyId: string, result: boolean): void {
    const payload = {
      moduleName: 'POLICY',
      recordId: policyId,
      newStatus: result,
    };

    this.policyService
      .UpdateStatusByModule(payload)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to Update policy Status');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        this.ngZone.run(() => {
          try {
            if (res?.data) {
              this.toast.success('Policy Status Update successfully.');
              this.getPolicies();
            } else {
              this.toast.error(res?.message || 'Failed to update status.');
            }
          } catch {
            this.toast.error('Error Update policy status.');
          } finally {
            this.cdr.detectChanges();
          }
        });
      });
  }
}

/* CSV Helper */
function escapeCsv(input: any) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return `"${str.replace(/"/g, '""')}"`;
}
