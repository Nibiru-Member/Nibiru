import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RoleDialogComponent } from './role-dialog/role-dialog.component';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { RoleService } from 'src/app/core/services/role/role.service';
import { catchError, EMPTY, take } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, MatTooltipModule, FormsModule],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css'],
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
export class RoleComponent implements OnInit {
  users: User[] = [];

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;
  paginationPages: number[] = [];
  isLoading = false;

  // Search, Filter, Sort
  searchText = '';
  filterText = '';
  showFilter = false;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  openedMenu: number | null = null;
  private searchTimer: any;

  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private activityLogger = inject(ActivityLoggerService);
  private roleService = inject(RoleService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit(): void {
    this.getRoles();
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

  goToFirst() {
    if (this.page !== 1) {
      this.page = 1;
      this.getRoles();
    }
  }

  goToLast() {
    if (this.page !== this.totalPages) {
      this.page = this.totalPages;
      this.getRoles();
    }
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.getRoles();
    }
  }

  // SEARCH
  debouncedSearch() {
    clearTimeout(this.searchTimer);

    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.getRoles();
    }, 400);
  }

  // FILTER
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  applyFilter() {
    this.updateFilteredList();
  }

  // SORT
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.updateFilteredList();
  }

  // FILTER + SORT CALCULATION
  updateFilteredList() {
    this.cdr.detectChanges();
  }

  get filteredAndSortedUsers() {
    let list = [...this.users];

    // FILTER
    if (this.filterText?.trim()) {
      const search = this.filterText.toLowerCase();
      list = list.filter((u) => u.name?.toLowerCase().includes(search));
    }
    // SORT
    if (this.sortColumn) {
      list.sort((a, b) => {
        const A = (this.sortColumn === 'name' ? a.name : '').toString().toLowerCase();
        const B = (this.sortColumn === 'name' ? b.name : '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }
    return list;
  }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    // If clicking the 3-dot button or inside dropdown → do nothing
    if (target.closest('.role-menu-button') || target.closest('.role-menu-dropdown')) {
      return;
    }

    // Otherwise close the menu
    this.openedMenu = null;
  }

  toggleMenu(index: number) {
    this.openedMenu = this.openedMenu === index ? null : index;
  }

  closeMenu() {
    this.openedMenu = null;
  }
  getStatusClass(isActive: boolean): string {
    return isActive
      ? 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
      : 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
  }
  // API CALL (Search-only)
  getRoles() {
    this.isLoading = true;
    this.roleService
      .getRolesList(this.page, this.pageSize, this.searchText)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load roles');
          this.isLoading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if ([200, 201].includes(res?.statusCode)) {
          this.users = res.data?.roleList || [];
          this.totalRecords = res.data?.totalRecords || 0;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.updatePaginationPages();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  // CSV EXPORT
  exportCSV() {
    const rows = this.filteredAndSortedUsers;

    if (!rows.length) {
      this.toast.error('No data to export');
      return;
    }

    // Helper to format ISO date
    const formatDate = (date: any) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0') +
        ' ' +
        String(d.getHours()).padStart(2, '0') +
        ':' +
        String(d.getMinutes()).padStart(2, '0') +
        ':' +
        String(d.getSeconds()).padStart(2, '0')
      );
    };

    const csvHeader = ['Name', 'Created At', 'Status'];

    const csvRows = rows.map((u) =>
      [`"${u.name ?? ''}"`, `"${formatDate(u.createdAt)}"`, `"${u.isActive ? 'Active' : 'Inactive'}"`].join(','),
    );

    const csvContent = [csvHeader.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${Date.now()}.csv`;
    link.click();
  }

  // EDIT / PERMISSION / DELETE
  onAddEditRole(user?: User) {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      data: user,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.getRoles();
    });
  }

  onPermission(id: string) {
    this.router.navigate(['/master/role-permission', id]);
  }

  openConfirmationDialog(id: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE ROLE',
        message: 'Do you really want to delete this role?',
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.onDelete(id);
    });
  }

  onDelete(id: string) {
    const role = this.users.find((x) => x.id === id);
    const roleName = role?.name || '';
    this.roleService
      .deleteRoleRecord(id)
      .pipe(
        catchError(() => {
          this.toast.error('Error deleting role');
          // CENTRAL - FAILED
          this.activityLogger.logDelete('Role', roleName, id, false);
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200) {
          this.toast.success(response.message);
          // CENTRAL - SUCCESS
          this.activityLogger.logDelete('Role', roleName, id, true);
          this.getRoles();
        } else {
          this.toast.error(response?.message || 'Failed to delete role');
          // CENTRAL - FAILED
          this.activityLogger.logDelete('Role', roleName, id, false);
        }
      });
  }

  get endRecord() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }
}
