import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, take } from 'rxjs';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { LookupDialogComponent } from './lookup-dialog/lookup-dialog.component';
import { SubLookupDialogComponent } from './sub-lookup-dialog/sub-lookup-dialog.component';
import { LookupRecord, SubLookupRecord } from 'src/app/core/models/lookup.model';
import { LookupService } from 'src/app/core/services/Lookup/lookup.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, style, animate, transition } from '@angular/animations';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, MatTooltipModule],
  templateUrl: './lookup.component.html',
  styleUrls: ['./lookup.component.css'],
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
export class LookupComponent implements OnInit {
  private dialog = inject(MatDialog);
  private activityLogger = inject(ActivityLoggerService);
  private toast = inject(ToasterService);
  private lookupService = inject(LookupService);
  private encryptionService = inject(EncryptionService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  lookups: LookupRecord[] = [];
  pagedLookups: LookupRecord[] = []; // current page slice from filteredAndSortedLookups
  subLookups: { [key: string]: SubLookupRecord[] } = {};

  expandedLookupId: any | null = null;
  isLoading = false;

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;
  paginationPages: number[] = [];

  // Search / Filter / Sort / Menu
  searchText = '';
  private searchTimer: any;
  filterText = '';
  showFilter = false;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  openedMenu: string | null = null;

  userData: any;

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.userData = JSON.parse(authUser);
    this.getLookups();
  }

  // ---------- Pagination helpers ----------
  loadPagedLookupsFromFiltered() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    const filtered = this.filteredAndSortedLookups;
    this.totalRecords = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    this.pagedLookups = filtered.slice(start, end);
  }

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

  get endRecord() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  changePage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadPagedLookupsFromFiltered();
    this.updatePaginationPages();
  }

  goToFirst() {
    this.page = 1;
    this.loadPagedLookupsFromFiltered();
    this.updatePaginationPages();
  }

  goToLast() {
    this.page = this.totalPages;
    this.loadPagedLookupsFromFiltered();
    this.updatePaginationPages();
  }

  // ---------- API: fetch lookups (search only passed to API like Role) ----------
  getLookups(): void {
    this.isLoading = true;
    this.lookupService
      // sending search as 3rd arg (same behavior as Role). If your service signature differs, revert to (this.page, this.pageSize).
      .getLookUpList(this.page, this.pageSize, this.searchText)
      .pipe(
        catchError(() => {
          this.isLoading = false;
          this.toast.error('Failed to load lookups');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.success && res?.statusCode === 200) {
          this.lookups = [...(res.data?.lookUpList || [])];
          // recalc pagination from filtered results
          this.loadPagedLookupsFromFiltered();
          this.updatePaginationPages();
        } else {
          this.toast.error(res?.message || 'Failed to load lookups');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // ---------- Sub lookups ----------
  getSubLookups(lookupId: string): void {
    this.isLoading = true;
    this.lookupService
      .getSubLookUpListRecord(lookupId)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load sub-lookups');
          this.isLoading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res?.success && res?.statusCode === 200) {
          this.subLookups = {
            ...this.subLookups,
            [lookupId]: [...(res.data?.subLookUpList || [])],
          };
        } else {
          this.toast.error('Failed to load sub-lookups');
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  toggleExpand(lookupId: string) {
    this.expandedLookupId = this.expandedLookupId === lookupId ? null : lookupId;
    if (this.expandedLookupId && !this.subLookups[lookupId]) {
      this.getSubLookups(lookupId);
    }
  }

  // ---------- Add / Edit ----------
  onAddEditLookup(lookup?: LookupRecord): void {
    const dialogRef = this.dialog.open(LookupDialogComponent, {
      data: lookup,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.getLookups();
    });
  }

  onAddEditSubLookup(lookup: LookupRecord, subLookup?: SubLookupRecord): void {
    const dialogRef = this.dialog.open(SubLookupDialogComponent, {
      data: {
        subLookup: subLookup
          ? { ...subLookup, lookUpId: lookup.lookUpId }
          : { lookUpId: lookup.lookUpId, name: '', value: '', valueInt: 0, isActive: true },
        lookups: this.lookups,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.expandedLookupId) {
        this.getSubLookups(this.expandedLookupId);
      }
    });
  }

  // ---------- Delete ----------
  openConfirmationDialog(id: string, type: 'lookup' | 'sublookup'): void {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: `DELETE ${type.toUpperCase()}`,
        message: `Do you really want to delete this ${type}?`,
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      if (type === 'lookup') {
        this.onDeleteLookup(id);
      } else {
        this.onDeleteSubLookup(id);
      }
    });
  }

  onDeleteLookup(id: string): void {
    const lookup = this.lookups.find((x) => x.lookUpId === id);
    const lookupName = lookup?.lookUpName || '';

    this.lookupService
      .deleteLookUpRecordById(id, this.userData.userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response?.statusCode === 200) {
            this.toast.success(response.message);

            // SUCCESS LOG
            this.activityLogger.logDelete('Lookup', lookupName, id, true);

            this.getLookups();
          } else {
            this.toast.error(response?.message || 'Failed to delete lookup');

            // FAILED LOG
            this.activityLogger.logDelete('Lookup', lookupName, id, false);
          }
        },
        error: () => {
          this.toast.error('Failed to delete lookup');

          // FAILED LOG
          this.activityLogger.logDelete('Lookup', lookupName, id, false);
        },
      });
  }

  onDeleteSubLookup(id: string): void {
    const parentLookupId = this.expandedLookupId;
    const subLookupList = this.subLookups[parentLookupId] || [];
    const subLookup = subLookupList.find((s) => s.subLookUpId === id);
    const subLookupName = subLookup?.lookUpName || '';

    this.lookupService
      .deleteSubLookUpRecordById(id, this.userData.userId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          if (response?.statusCode === 200) {
            this.toast.success(response.message);

            // SUCCESS LOG
            this.activityLogger.logDelete('SubLookup', subLookupName, id, true);

            if (parentLookupId) this.getSubLookups(parentLookupId);
          } else {
            this.toast.error(response?.message || 'Failed to delete sub-lookup');

            // FAILED LOG
            this.activityLogger.logDelete('SubLookup', subLookupName, id, false);
          }
        },
        error: () => {
          this.toast.error('Failed to delete sub-lookup');

          // FAILED LOG
          this.activityLogger.logDelete('SubLookup', subLookupName, id, false);
        },
      });
  }

  getStatusClass(isActive: boolean): string {
    return isActive
      ? 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
      : 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
  }

  // ---------- Search (debounced) ----------
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.getLookups();
    }, 400);
  }

  // ---------- Filter ----------
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  applyFilter() {
    this.page = 1;
    this.loadPagedLookupsFromFiltered();
    this.updatePaginationPages();
    this.cdr.detectChanges();
  }

  // ---------- Sort ----------
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.loadPagedLookupsFromFiltered();
    this.updatePaginationPages();
    this.cdr.detectChanges();
  }

  get filteredAndSortedLookups() {
    let list = [...this.lookups];

    // Client-side filter (if filterText set)
    if (this.filterText?.trim()) {
      const ft = this.filterText.toLowerCase();
      list = list.filter((l) => l.lookUpName?.toLowerCase().includes(ft));
    }

    // Safe typed sort — only support lookUpName for now
    if (this.sortColumn === 'lookUpName') {
      list.sort((a, b) => {
        const A = (a.lookUpName ?? '').toString().toLowerCase();
        const B = (b.lookUpName ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    return list;
  }

  // ---------- 3-dots menu ----------
  toggleMenu(key: string) {
    this.openedMenu = this.openedMenu === key ? null : key;
  }

  closeMenu() {
    this.openedMenu = null;
  }

  // Close dropdown when clicking outside any menu/button
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('.lookup-menu-button') || target.closest('.lookup-menu-dropdown')) {
      return;
    }
    this.openedMenu = null;
  }

  exportCSV() {
    const rows: string[] = [];

    // CSV HEADER
    rows.push(['Lookup Type', 'Created At', 'Status'].join(','));

    const list = this.filteredAndSortedLookups;

    const formatDate = (date: any) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return (
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      );
    };

    const escapeCsv = (value: any) => {
      if (value == null) return '';
      const str = String(value);
      // Escape quotes and wrap fields containing commas or quotes
      if (str.includes('"') || str.includes(',')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    for (const l of list) {
      rows.push(
        [escapeCsv(l.lookUpName), `"${formatDate(l.createdDate)}"`, l.isActive ? 'Active' : 'Inactive'].join(','),
      );
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lookups_${Date.now()}.csv`;
    link.click();
  }
}

// ---------- small helper outside class ----------
function escapeCsv(input: any) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  // wrap in double quotes and escape existing double quotes
  return `"${str.replace(/"/g, '""')}"`;
}
