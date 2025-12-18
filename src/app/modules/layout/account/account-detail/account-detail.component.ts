import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { AccountDetail } from 'src/app/core/models/account.model';
import { AccountService } from 'src/app/core/services/Account/account.service';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { UserService } from 'src/app/core/services/user/user.service';
import { AddEditUserComponent } from '../USER/add-edit-user/add-edit-user.component';
import { FormsModule } from '@angular/forms';
import { trigger, style, animate, transition } from '@angular/animations';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, MatTooltipModule, FormsModule],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css'],
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
export class AccountDetailComponent implements OnInit {
  activeTab: 'info' | 'users' = 'info';
  account: AccountDetail | null = null;

  users: User[] = [];
  pagedUsers: User[] = [];

  // Pagination
  page = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 0;
  paginationPages: number[] = [];
  isLoading = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() profilePictureUploaded = new EventEmitter<{ file: File; dataUrl: string }>();

  base64Image: string | null = null;
  selectedFile: File | null = null;
  isImageChanged = false;

  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private userService = inject(UserService);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private activityLogger = inject(ActivityLoggerService);

  UserId: string | null = null;
  AccountId: string | null = null;

  // Search / Filter / Sort / Menu
  searchText = '';
  private searchTimer: any;
  filterText = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  openedMenu: string | null = null;

  ngOnInit(): void {
    const authUser = localStorage.getItem('authObj');
    if (authUser) {
      const parsed = JSON.parse(authUser);
      this.UserId = parsed.userId;
    }

    this.route.params.subscribe((params) => {
      const accountId = params['id'];
      if (accountId) {
        this.AccountId = accountId;
        this.getAccountDetails(accountId);
        this.getUsers();
      }
    });
  }

  /** -------------------------------------------
   * FETCH ACCOUNT DETAILS
   -------------------------------------------- */
  getAccountDetails(accountId: string): void {
    this.isLoading = true;
    this.accountService
      .getAccountDetailById(accountId)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load account info');
          this.isLoading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        try {
          if (res?.statusCode === 200) {
            this.account = res.data;
            this.base64Image = res.data.fileData ? `data:image/png;base64,${res.data.fileData}` : null;
          } else {
            this.toast.error(res?.message || 'Failed to load account info');
          }
        } finally {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /** -------------------------------------------
   * FETCH USERS UNDER ACCOUNT (WITH PAGINATION)
   -------------------------------------------- */
  getUsers(): void {
    this.userService
      .getUserRecordList()
      .pipe(
        catchError(() => {
          this.toast.error('Failed to load users');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        try {
          if (res?.statusCode === 200) {
            const allUsers = res.data?.userList || [];
            // Filter for this account
            this.users = allUsers.filter((u: User) => u.accountId === this.AccountId);
            // initial client-side listing
            this.applyClientSideListing();
            this.updatePaginationPages();
          } else {
            this.toast.error(res?.message || 'Failed to load users');
          }
        } finally {
          this.cdr.detectChanges();
        }
      });
  }

  /** ⭐ Build pagination numbers */
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

  /** ⭐ Pagination Navigation */
  get endRecord() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadPagedUsers();
    this.updatePaginationPages();
  }

  goToFirst() {
    this.page = 1;
    this.loadPagedUsers();
    this.updatePaginationPages();
  }

  goToLast() {
    this.page = this.totalPages;
    this.loadPagedUsers();
    this.updatePaginationPages();
  }

  /** -------------------------------------------
   * EDIT & DELETE USER
   -------------------------------------------- */
  onAddEditUser(user?: User): void {
    const dialogRef = this.dialog.open(AddEditUserComponent, {
      data: user,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      // child component logs creation/update itself; here we refresh and log fallback if needed
      if (result === 'created') {
        this.getUsers();
      } else if (result === 'updated') {
        this.activityLogger.logUpdate(
          'User',
          `User updated successfully under account ${this.account?.companyName || this.AccountId}`,
          this.AccountId || '',
          true,
        );
        this.getUsers();
      }
    });
  }

  openConfirmationDialog(id: string): void {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE USER',
        message: 'Do you really want to delete this user?',
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.onDelete(id);
    });
  }

  onDelete(id: string): void {
    const user = this.users.find((u) => u.id === id);
    const userName = user?.userName || id;

    this.userService
      .deleteUserRecordByUserId(id)
      .pipe(
        catchError(() => {
          // Log failure
          this.activityLogger.logDelete(
            'User',
            `User delete failed for ${userName} under account ${this.account?.companyName || this.AccountId}`,
            id,
            false,
          );
          this.toast.error('Failed to delete user');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200) {
          this.toast.success('User deleted successfully');

          // Log success
          this.activityLogger.logDelete(
            'User',
            `User deleted successfully: ${userName} under account ${this.account?.companyName || this.AccountId}`,
            id,
            true,
          );

          this.getUsers();
        } else {
          this.toast.error(response?.message || 'Failed to delete user');

          // Log failure
          this.activityLogger.logDelete(
            'User',
            `User delete failed for ${userName} under account ${this.account?.companyName || this.AccountId}`,
            id,
            false,
          );
        }
      });
  }

  /** -------------------------------------------
   * TAB SWITCH
   -------------------------------------------- */
  setActiveTab(tab: 'info' | 'users'): void {
    this.activeTab = tab;
  }

  /* ---------------------------
     CLIENT-SIDE SEARCH / FILTER / SORT / CSV / MENU
     --------------------------- */

  // Debounced local search
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.applyClientSideListing();
      this.updatePaginationPages();
      this.cdr.detectChanges();
    }, 300);
  }

  // Sorting: supports userName & email only (typed access)
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.applyClientSideListing();
    this.updatePaginationPages();
    this.cdr.detectChanges();
  }

  // Build filtered + sorted list and slice page
  applyClientSideListing() {
    let list = (this.users || []).slice(0);

    // searchText (local)
    if (this.searchText?.trim()) {
      const s = this.searchText.toLowerCase();
      list = list.filter(
        (u) =>
          (u.userName || '').toLowerCase().includes(s) ||
          (u.email || '').toLowerCase().includes(s) ||
          (u.roleName || '').toLowerCase().includes(s),
      );
    }

    // filterText (additional)
    if (this.filterText?.trim()) {
      const ft = this.filterText.toLowerCase();
      list = list.filter(
        (u) => (u.userName || '').toLowerCase().includes(ft) || (u.roleName || '').toLowerCase().includes(ft),
      );
    }

    // sort safe typed
    if (this.sortColumn === 'userName') {
      list.sort((a, b) => {
        const A = (a.userName ?? '').toString().toLowerCase();
        const B = (b.userName ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    } else if (this.sortColumn === 'email') {
      list.sort((a, b) => {
        const A = (a.email ?? '').toString().toLowerCase();
        const B = (b.email ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    // update totals and paged slice
    this.totalRecords = list.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = list.slice(start, end);
  }

  loadPagedUsers() {
    this.applyClientSideListing();
  }

  // 3-dots menu helper
  toggleMenu(key: string) {
    this.openedMenu = this.openedMenu === key ? null : key;
  }

  closeMenu() {
    this.openedMenu = null;
  }

  // click outside to close menu
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('.user-menu-button') || target.closest('.user-menu-dropdown')) return;
    this.openedMenu = null;
  }

  // CSV export (filtered & sorted results)
  exportUsersCSV() {
    const rows: string[] = [];
    rows.push(['Name', 'Email', 'Phone', 'Role'].join(','));

    // Build same list as applyClientSideListing but full (not paged)
    let list = (this.users || []).slice(0);

    if (this.searchText?.trim()) {
      const s = this.searchText.toLowerCase();
      list = list.filter(
        (u) =>
          (u.userName || '').toLowerCase().includes(s) ||
          (u.email || '').toLowerCase().includes(s) ||
          (u.roleName || '').toLowerCase().includes(s),
      );
    }

    if (this.filterText?.trim()) {
      const ft = this.filterText.toLowerCase();
      list = list.filter(
        (u) => (u.userName || '').toLowerCase().includes(ft) || (u.roleName || '').toLowerCase().includes(ft),
      );
    }

    if (this.sortColumn === 'userName') {
      list.sort((a, b) => {
        const A = (a.userName ?? '').toString().toLowerCase();
        const B = (b.userName ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    } else if (this.sortColumn === 'email') {
      list.sort((a, b) => {
        const A = (a.email ?? '').toString().toLowerCase();
        const B = (b.email ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    for (const u of list) {
      rows.push([escapeCsv(u.userName), escapeCsv(u.email), escapeCsv(u.phoneNumber), escapeCsv(u.roleName)].join(','));
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().getTime()}.csv`;
    link.click();
  }
}

// helper for CSV quoting
function escapeCsv(input: any) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return `"${str.replace(/"/g, '""')}"`;
}
