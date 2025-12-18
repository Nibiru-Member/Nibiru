import { ChangeDetectorRef, Component, HostListener, NgZone, inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';
import { AccountService } from 'src/app/core/services/Account/account.service';
import { AccountDetail } from 'src/app/core/models/account.model';
import { RouterLink } from '@angular/router';
import { AddEditAccountComponent } from '../add-edit-account/add-edit-account.component';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, RouterLink, FormsModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))]),
    ]),
  ],
})
export class AccountListComponent implements OnInit {
  private activityLogger = inject(ActivityLoggerService);
  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  accounts: AccountDetail[] = [];

  // Search + Filter
  searchText = '';
  filterText = '';
  showFilter = false;
  private searchTimer: any;
  userData: any;
  isLoading = false;
  // Sort
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dropdown menu
  openedMenu: number | null = null;

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;
  paginationPages: number[] = [];

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.userData = JSON.parse(authUser);
    this.getAccounts();
  }

  // CLOSE ACTION MENU OUTSIDE CLICK
  @HostListener('document:click', ['$event'])
  onClickOutside(ev: Event) {
    const target = ev.target as HTMLElement;

    if (target.closest('.role-menu-button') || target.closest('.role-menu-dropdown')) return;

    this.openedMenu = null;
  }

  toggleMenu(i: number) {
    this.openedMenu = this.openedMenu === i ? null : i;
  }

  closeMenu() {
    this.openedMenu = null;
  }

  // FILTER
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }
  applyFilter() {
    this.cdr.detectChanges();
  }

  // SEARCH (debounced API)
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.getAccounts();
    }, 400);
  }

  // SORT
  sortBy(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.cdr.detectChanges();
  }

  get filteredAndSortedAccounts() {
    let list = [...this.accounts];

    // FILTER
    if (this.filterText.trim()) {
      const val = this.filterText.toLowerCase();
      list = list.filter(
        (acc) =>
          acc.companyName?.toLowerCase().includes(val) ||
          acc.email?.toLowerCase().includes(val) ||
          acc.licenseType?.toLowerCase().includes(val),
      );
    }

    // SORT
    if (this.sortColumn) {
      list.sort((a: any, b: any) => {
        const A = (a[this.sortColumn] ?? '').toString().toLowerCase();
        const B = (b[this.sortColumn] ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    return list;
  }

  // API CALL
  getAccounts() {
    this.isLoading = true;

    this.accountService
      .getAccountDetailList(this.page, this.pageSize, this.searchText)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load accounts');
          this.isLoading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if ([200, 201].includes(res?.statusCode)) {
          this.accounts = res?.data || [];
          this.totalRecords = res?.data?.[0]?.totalRecords ?? 0;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.updatePaginationPages();
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // PAGINATION
  updatePaginationPages() {
    const pages = [];
    const max = 5;

    let start = Math.max(1, this.page - 2);
    let end = Math.min(this.totalPages, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - (max - 1));
    }

    for (let i = start; i <= end; i++) pages.push(i);

    this.paginationPages = pages;
  }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.getAccounts();
  }

  goToFirst() {
    this.page = 1;
    this.getAccounts();
  }

  goToLast() {
    this.page = this.totalPages;
    this.getAccounts();
  }

  get endRecord() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  // CSV EXPORT
  exportAccountsCSV() {
    const rows = this.filteredAndSortedAccounts;
    if (!rows.length) return this.toast.error('No accounts to export');

    const header = ['Company Name', 'Email', 'Phone', 'Website', 'License Type'];
    const data = rows.map((acc) =>
      [acc.companyName, acc.email, acc.phone1, acc.website, acc.licenseType].map((v) => `"${v ?? ''}"`).join(','),
    );

    const csv = [header.join(','), ...data].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accounts_${Date.now()}.csv`;
    link.click();
  }

  // EDIT
  onAddEditAccount(acc?: AccountDetail) {
    const dialogRef = this.dialog.open(AddEditAccountComponent, {
      width: '850px',
      disableClose: true,
      data: acc,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ngZone.run(() => this.getAccounts());
      }
    });
  }

  // DELETE
  onDeleteAccount(id: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE ACCOUNT',
        message: 'Do you really want to delete this account?',
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((yes) => {
      if (yes) this.deleteAccount(id);
    });
  }

  deleteAccount(accountId: string): void {
    const account = this.accounts.find((x) => x.accountId === accountId);
    const accountName = account?.companyName || '';
    const userId = this.userData?.userId;
    this.accountService
      .deleteAccount(accountId, userId)
      .pipe(
        catchError((error) => {
          this.toast.error('Failed to delete account');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        this.ngZone.run(() => {
          try {
            if (res?.data) {
              this.toast.success('Account deleted successfully');
              this.activityLogger.logDelete('Account', accountName, accountId, true);
              this.getAccounts(); // Refresh the list
            } else {
              this.toast.error(res?.message || 'Failed to delete account');
              this.activityLogger.logDelete('Account', accountName, accountId, false);
            }
          } catch (error) {
            this.toast.error('Error deleting account');
            this.activityLogger.logDelete('Account', accountName, accountId, false);
          } finally {
            this.cdr.detectChanges();
          }
        });
      });
  }
}
