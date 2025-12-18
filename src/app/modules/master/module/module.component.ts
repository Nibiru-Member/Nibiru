import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, take } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModuleRecord, ModulePermision } from 'src/app/core/models/module.model';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { lowercaseFirstLetterKeys } from 'src/app/shared/utils/utils';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CommonModule as CM } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuleDialogComponent } from './module-dialog/module-dialog.component';
import { ModuleService } from 'src/app/core/services/module/module.service';
import { ModulePermissionComponent } from './module-permission/module-permission.component';
import { trigger, style, animate, transition } from '@angular/animations';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

type PermissionPaginationState = {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  pages: number[];
  permissions: ModulePermision[];
  loading: boolean;
};

@Component({
  selector: 'app-module',
  standalone: true,
  imports: [CommonModule, CM, AngularSvgIconModule, MatTooltipModule, FormsModule],
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.css'],
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
export class ModuleComponent implements OnInit {
  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private moduleService = inject(ModuleService);
  private encryptionService = inject(EncryptionService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private activityLogger = inject(ActivityLoggerService);

  // Modules
  modules: ModuleRecord[] = [];
  pagedModules: ModuleRecord[] = []; // current page slice from filteredAndSorted
  expandedModuleId: string | null = null;
  isLoading = false;

  // Module list pagination (server-side)
  modulePage = 1;
  modulePageSize = 10;
  moduleTotalRecords = 0;
  moduleTotalPages = 0;
  modulePages: number[] = [];

  // Permissions per-module (server-side pagination)
  permissionState: Record<string, PermissionPaginationState> = {};

  // search/filter/sort/menu
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
    this.getModules();
  }

  /* ---------------------------
     Module pagination helpers
     --------------------------- */

  private buildModulePages() {
    const pages: number[] = [];
    const maxToShow = 5;
    let start = Math.max(1, this.modulePage - 2);
    let end = Math.min(this.moduleTotalPages, start + maxToShow - 1);
    if (end - start < maxToShow - 1) {
      start = Math.max(1, end - (maxToShow - 1));
    }
    for (let p = start; p <= end; p++) pages.push(p);
    this.modulePages = pages;
  }

  get moduleEndRecord() {
    return Math.min(this.modulePage * this.modulePageSize, this.moduleTotalRecords);
  }

  changeModulePage(p: number) {
    if (p < 1 || p > this.moduleTotalPages) return;
    this.modulePage = p;
    this.getModules();
  }

  goToFirstModule() {
    if (this.modulePage === 1) return;
    this.modulePage = 1;
    this.getModules();
  }

  goToLastModule() {
    if (this.modulePage === this.moduleTotalPages) return;
    this.modulePage = this.moduleTotalPages;
    this.getModules();
  }

  /* ---------------------------
     Permission pagination helpers
     --------------------------- */

  private ensurePermissionState(moduleId: string) {
    if (!this.permissionState[moduleId]) {
      this.permissionState[moduleId] = {
        page: 1,
        pageSize: 10,
        totalRecords: 0,
        totalPages: 0,
        pages: [],
        permissions: [],
        loading: false,
      };
    }
  }

  private buildPermissionPages(moduleId: string) {
    const state = this.permissionState[moduleId];
    if (!state) return;
    const pages: number[] = [];
    const maxToShow = 5;
    let start = Math.max(1, state.page - 2);
    let end = Math.min(state.totalPages, start + maxToShow - 1);
    if (end - start < maxToShow - 1) {
      start = Math.max(1, end - (maxToShow - 1));
    }
    for (let p = start; p <= end; p++) pages.push(p);
    state.pages = pages;
  }

  permissionEndRecord(moduleId: string) {
    const s = this.permissionState[moduleId];
    if (!s) return 0;
    return Math.min(s.page * s.pageSize, s.totalRecords);
  }

  changePermissionPage(moduleId: string, p: number) {
    const s = this.permissionState[moduleId];
    if (!s) return;
    if (p < 1 || p > s.totalPages) return;
    s.page = p;
    this.getPermissions(moduleId, s.page, s.pageSize);
  }

  goToFirstPermission(moduleId: string) {
    const s = this.permissionState[moduleId];
    if (!s) return;
    if (s.page === 1) return;
    s.page = 1;
    this.getPermissions(moduleId, s.page, s.pageSize);
  }

  goToLastPermission(moduleId: string) {
    const s = this.permissionState[moduleId];
    if (!s) return;
    if (s.page === s.totalPages) return;
    s.page = s.totalPages;
    this.getPermissions(moduleId, s.page, s.pageSize);
  }

  /* ---------------------------
     API calls
     --------------------------- */

  getModules(): void {
    this.isLoading = true;
    this.moduleService
      .getModulesList(this.modulePage, this.modulePageSize, this.searchText)
      .pipe(
        catchError((err) => {
          this.toast.error('Failed to load modules');
          this.isLoading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        try {
          if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            this.modules = res.data?.moduleList || [];
            this.moduleTotalRecords = res.data?.totalRecords ?? (this.modules.length || 0);
            this.moduleTotalPages = Math.max(1, Math.ceil(this.moduleTotalRecords / this.modulePageSize));
            this.applyClientSideListing();
            this.buildModulePages();
          } else {
            this.toast.error(res?.message || 'Failed to load modules');
          }
        } catch (error) {
          this.toast.error('Error processing module data');
        } finally {
          this.isLoading = false;
          setTimeout(() => this.cdr.detectChanges());
        }
      });
  }

  // permissions for module (server-side)
  getPermissions(moduleId: string, page = 1, pageSize = 10): void {
    this.isLoading = true;
    this.ensurePermissionState(moduleId);
    const state = this.permissionState[moduleId];
    this.moduleService
      .getModulesPermissionList(moduleId, page, pageSize)
      .pipe(
        catchError((err) => {
          this.toast.error('Failed to load permissions');
          state.loading = false;
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        try {
          if (res && (res.statusCode === 200 || res.statusCode === 201)) {
            state.permissions = res.data?.permissionList || [];
            state.totalRecords = res.data?.totalRecords ?? (state.permissions.length || 0);
            state.totalPages = Math.max(1, Math.ceil(state.totalRecords / state.pageSize));
            this.buildPermissionPages(moduleId);
          } else {
            this.toast.error(res?.message || 'Failed to load permissions');
          }
        } catch (error) {
          this.toast.error('Error processing permissions data');
        } finally {
          this.isLoading = false;
          setTimeout(() => this.cdr.detectChanges());
        }
      });
  }

  /* ---------------------------
     UI actions: add/edit/delete
     --------------------------- */

  onAddEditModule(module?: ModuleRecord): void {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      data: module,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getModules();
      }
    });
  }

  onAddEditPermission(moduleId: string, permission?: ModulePermision): void {
    const dialogRef = this.dialog.open(ModulePermissionComponent, {
      data: {
        moduleId,
        permission,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ensurePermissionState(moduleId);
        const s = this.permissionState[moduleId];
        this.getPermissions(moduleId, s.page, s.pageSize);
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  toggleModuleExpansion(moduleId: string): void {
    if (this.expandedModuleId === moduleId) {
      this.expandedModuleId = null;
    } else {
      this.expandedModuleId = moduleId;
      this.ensurePermissionState(moduleId);
      const s = this.permissionState[moduleId];
      s.page = 1;
      s.pageSize = 10;
      this.getPermissions(moduleId, s.page, s.pageSize);
    }
  }

  openConfirmationDialog(id: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE MODULE',
        message: 'Do you really want to delete this Module?',
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onDelete(id);
      }
    });
  }

  openPermissionConfirmationDialog(permissionId: string, moduleId: string) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE PERMISSION',
        message: 'Do you really want to delete this Permission?',
        cancelText: 'CANCEL',
        submitText: 'DELETE',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.onDeletePermission(permissionId, moduleId);
      }
    });
  }

  onDelete(id: string): void {
    const moduleRecord = this.modules.find((m) => m.id === id);
    const moduleName = moduleRecord?.moduleName || '';

    this.moduleService
      .deleteModuleRecord(id)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to delete module');

          // LOG FAILURE
          this.activityLogger.logDelete('Module', moduleName, id, false);

          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200) {
          this.toast.success(response.message);

          // LOG SUCCESS
          this.activityLogger.logDelete('Module', moduleName, id, true);

          this.getModules();
          this.expandedModuleId = null;
          setTimeout(() => this.cdr.detectChanges());
        } else {
          this.toast.error(response?.message || 'Failed to delete module');

          // LOG FAILURE
          this.activityLogger.logDelete('Module', moduleName, id, false);
        }
      });
  }

  onDeletePermission(permissionId: string, moduleId: string): void {
    const state = this.permissionState[moduleId];
    const permission = state?.permissions?.find((p) => p.id === permissionId);
    const permissionAction = permission?.action || '';

    this.moduleService
      .deleteModulePermission(permissionId)
      .pipe(
        catchError(() => {
          this.toast.error('Failed to delete permission');

          // LOG FAILURE
          this.activityLogger.logDelete('Module Permission', permissionAction, permissionId, false);

          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200) {
          this.toast.success(response.message);

          // LOG SUCCESS
          this.activityLogger.logDelete('Module Permission', permissionAction, permissionId, true);

          const s = this.permissionState[moduleId];
          if (s) this.getPermissions(moduleId, s.page, s.pageSize);
        } else {
          this.toast.error(response?.message || 'Failed to delete permission');

          // LOG FAILURE
          this.activityLogger.logDelete('Module Permission', permissionAction, permissionId, false);
        }
      });
  }

  getStatusClass(isActive: boolean): string {
    return isActive
      ? 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800'
      : 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800';
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  applyFilter() {
    this.modulePage = 1;
    this.applyClientSideListing();
    this.buildModulePages();
    this.cdr.detectChanges();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.modulePage = 1;
    this.applyClientSideListing();
    this.buildModulePages();
    this.cdr.detectChanges();
  }

  // Applies client-side filter/sort and recalculates pagedModules & counts
  applyClientSideListing() {
    let list = [...this.modules];

    // Filter (client-side)
    if (this.filterText?.trim()) {
      const ft = this.filterText.toLowerCase();
      list = list.filter((m) => m.moduleName?.toLowerCase().includes(ft));
    }

    // Sort (safe typed)
    if (this.sortColumn === 'moduleName') {
      list.sort((a, b) => {
        const A = (a.moduleName ?? '').toString().toLowerCase();
        const B = (b.moduleName ?? '').toString().toLowerCase();
        return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    // Update moduleTotalRecords based on filtered list (important for paging UI)
    this.moduleTotalRecords = list.length;
    this.moduleTotalPages = Math.max(1, Math.ceil(this.moduleTotalRecords / this.modulePageSize));

    // Slice current page
    const start = (this.modulePage - 1) * this.modulePageSize;
    const end = start + this.modulePageSize;
    this.pagedModules = list.slice(start, end);
  }

  // 3-dots menu keys: 'module-<id>' and 'perm-<moduleId>-<permId>'
  toggleMenu(key: string) {
    this.openedMenu = this.openedMenu === key ? null : key;
  }

  closeMenu() {
    this.openedMenu = null;
  }

  // click outside to close any open menu
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (
      target.closest('.module-menu-button') ||
      target.closest('.module-menu-dropdown') ||
      target.closest('.permission-menu-button') ||
      target.closest('.permission-menu-dropdown')
    ) {
      return;
    }
    this.openedMenu = null;
  }

  // CSV export: exports filtered & sorted modules and their visible permission pages (if fetched)
  exportCSV() {
    const rows: string[] = [];
    rows.push(['Module Name', 'Module Description', 'Module Status'].join(','));

    // Use current filtered/sorted full list (not only paged)
    const list = (() => {
      let L = [...this.modules];
      if (this.filterText?.trim()) {
        const ft = this.filterText.toLowerCase();
        L = L.filter((m) => m.moduleName?.toLowerCase().includes(ft));
      }
      if (this.sortColumn === 'moduleName') {
        L.sort((a, b) => {
          const A = (a.moduleName ?? '').toString().toLowerCase();
          const B = (b.moduleName ?? '').toString().toLowerCase();
          return this.sortDirection === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
        });
      }
      return L;
    })();

    for (const m of list) {
      rows.push([escapeCsv(m.moduleName), escapeCsv(m.description), m.isActive ? 'Active' : 'Inactive'].join(','));
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `modules_${new Date().getTime()}.csv`;
    link.click();
  }
}

// helper for CSV quoting
function escapeCsv(input: any) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return `"${str.replace(/"/g, '""')}"`;
}
