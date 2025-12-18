import { ChangeDetectorRef, Component, inject, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, take } from 'rxjs';
import { ModuleRecord, ModulePermision } from 'src/app/core/models/module.model';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { lowercaseFirstLetterKeys } from 'src/app/shared/utils/utils';
import { CommonModule } from '@angular/common';
import { ModuleService } from 'src/app/core/services/module/module.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoleService } from 'src/app/core/services/role/role.service';
import { RolePermission } from 'src/app/core/models/role.model';

interface ModuleWithPermissions extends ModuleRecord {
  permissions: ModulePermision[];
}

@Component({
  selector: 'app-role-permission',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './role-permission.component.html',
  styleUrls: ['./role-permission.component.css'],
})
export class RolePermissionComponent implements OnInit {
  private dialog = inject(MatDialog);
  private toast = inject(ToasterService);
  private moduleService = inject(ModuleService);
  private roleService = inject(RoleService);
  private encryptionService = inject(EncryptionService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  modules: ModuleRecord[] = [];
  allPermissions: ModulePermision[] = [];
  selectedPermissions: Set<string> = new Set();
  modulesWithPermissions: ModuleWithPermissions[] = [];
  roleId: string = '';
  roleName: string = 'Loading...';
  isLoading: boolean = false;
  isSaving: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.roleId = params['id'];
      this.loadRoleData();
    });
  }

  loadRoleData(): void {
    this.isLoading = true;

    this.loadModules()
      .then(() => {
        const permissionPromises = this.modules.map((m) => this.loadPermissions(m.id));
        permissionPromises.push(this.loadExistingRolePermissions());
        return Promise.all(permissionPromises);
      })
      .finally(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  loadModules(): Promise<void> {
    return new Promise((resolve) => {
      this.moduleService
        .getModulesList(this.currentPage, this.pageSize)
        .pipe(
          catchError((error) => {
            this.toast.error('Failed to load modules');
            resolve(); // still resolve to avoid hanging
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((res: any) => {
          try {
            if (res && res.statusCode && [200, 201].includes(res.statusCode)) {
              this.modules = res.data?.moduleList || [];
            } else {
              this.toast.error(res.message || 'Failed to load modules');
            }
          } catch (error) {
            this.toast.error('Error parsing module data');
          } finally {
            resolve(); // <-- ✅ always resolve here
          }
        });
    });
  }

  loadPermissions(moduleId: string): Promise<void> {
    return new Promise((resolve) => {
      this.moduleService
        .getModulesPermissionList(moduleId, 1, 50)
        .pipe(
          catchError((error) => {
            this.toast.error('Failed to load permissions');
            resolve(); // ensure the Promise resolves even on error
            return EMPTY;
          }),
          take(1),
        )
        .subscribe({
          next: (res: any) => {
            try {
              if (res && res.statusCode && [200, 201].includes(res.statusCode)) {
                const modulePermissions = res.data?.permissionList || [];
                // Accumulate permissions instead of overwriting
                this.allPermissions = [...this.allPermissions, ...modulePermissions];

                // Map modules with permissions after each permission load
                this.mapModulesWithPermissions();
              } else {
                this.toast.error(res?.message || 'Failed to load permissions');
              }
            } catch (error) {
              this.toast.error('Error parsing permission data');
            } finally {
              resolve(); // resolve after processing
            }
          },
          error: (err) => {
            this.toast.error('Unexpected error loading permissions');
            resolve(); // always resolve to avoid hanging Promise
          },
        });
    });
  }

  loadExistingRolePermissions(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.roleId) {
        resolve();
        return;
      }

      this.roleService
        .getRolePermissionsDataByRoleId(this.roleId)
        .pipe(
          catchError((error) => {
            this.toast.error('Failed to load existing permissions');
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((res: any) => {
          this.ngZone.run(() => {
            try {
              if (res) {
                const existingPermissions = res.data?.permissionIds || [];
                this.selectedPermissions = new Set(existingPermissions);
                if (res.data?.roleName) {
                  this.roleName = res.data.roleName;
                }
              }
            } catch (error) {
              console.error('Error parsing existing permissions:', error);
            } finally {
              resolve();
            }
          });
        });
    });
  }

  mapModulesWithPermissions(): void {
    if (this.modules.length === 0) {
      return;
    }

    this.modulesWithPermissions = this.modules
      .map((module) => {
        const modulePermissions = this.allPermissions.filter((permission) => permission.moduleId === module.id);
        return {
          ...module,
          permissions: modulePermissions,
        };
      })
      .filter((module) => module.permissions.length > 0);

    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    if (this.modulesWithPermissions.length === 0) return false;

    const totalPermissions = this.modulesWithPermissions.reduce(
      (total, module) => total + module.permissions.length,
      0,
    );

    return this.selectedPermissions.size === totalPermissions;
  }

  isModuleSelected(moduleId: string): boolean {
    const module = this.modulesWithPermissions.find((m) => m.id === moduleId);
    if (!module || module.permissions.length === 0) return false;

    return module.permissions.every((permission) => this.selectedPermissions.has(permission.id));
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedPermissions.has(permissionId);
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      // Select all permissions
      this.modulesWithPermissions.forEach((module) => {
        module.permissions.forEach((permission) => {
          this.selectedPermissions.add(permission.id);
        });
      });
    } else {
      // Clear all selections
      this.selectedPermissions.clear();
    }
  }

  toggleModule(moduleId: string, event: any): void {
    const isChecked = event.target.checked;
    const module = this.modulesWithPermissions.find((m) => m.id === moduleId);

    if (!module) return;

    if (isChecked) {
      // Add all permissions from this module
      module.permissions.forEach((permission) => {
        this.selectedPermissions.add(permission.id);
      });
    } else {
      // Remove all permissions from this module
      module.permissions.forEach((permission) => {
        this.selectedPermissions.delete(permission.id);
      });
    }
  }

  togglePermission(permissionId: string, moduleId: string, event: any): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      this.selectedPermissions.add(permissionId);
    } else {
      this.selectedPermissions.delete(permissionId);
    }
  }

  savePermissions(): void {
    if (!this.roleId) {
      this.toast.error('No role selected');
      return;
    }

    this.isSaving = true;

    const rolePermissionData: RolePermission = {
      roleId: this.roleId,
      permissionIds: Array.from(this.selectedPermissions),
    };
    this.roleService
      .assignRolePermissionsToRole(rolePermissionData)
      .pipe(
        catchError((error) => {
          this.isSaving = false;
          this.toast.error('Failed to save permissions');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((res: any) => {
        this.ngZone.run(() => {
          try {
            if (res && res.statusCode && [200, 201].includes(res.statusCode)) {
              this.toast.success('Permissions saved successfully');
              this.router.navigate(['/master/role']);
            } else {
              this.toast.error(res.message || 'Failed to save permissions');
            }
          } catch (error) {
            this.toast.error('Error parsing save response');
          } finally {
            this.isSaving = false;
            this.cdr.detectChanges();
          }
        });
      });
  }

  cancel(): void {
    this.router.navigate(['/master/role']);
  }
}
