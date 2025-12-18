import { Component, inject, Inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgStyle } from '@angular/common';
import { RoleService } from 'src/app/core/services/role/role.service';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-role-dialog',
  templateUrl: './role-dialog.component.html',
  styleUrl: './role-dialog.component.css',
  imports: [FormsModule, ReactiveFormsModule, AngularSvgIconModule, NgClass, NgStyle],
})
export class RoleDialogComponent {
  roleForm!: FormGroup;
  submitted: boolean = false;

  private toast = inject(ToasterService);
  private roleService = inject(RoleService);
  private activityLogger = inject(ActivityLoggerService);
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<RoleDialogComponent>) {}

  ngOnInit() {
    this.initForm();
    if (this.data?.id) {
      this.patchFormValue();
    }
  }

  initForm() {
    this.roleForm = new FormGroup({
      roleName: new FormControl('', Validators.required),
      status: new FormControl(true, Validators.required),
    });
  }

  patchFormValue(): void {
    if (!this.data) return;

    this.roleForm.patchValue({
      roleName: this.data?.name ?? '',
      status: this.data?.isActive ?? false, // ✅ boolean safe default
    });
  }

  get f() {
    return this.roleForm.controls;
  }

  toggleStatus(): void {
    const current = this.roleForm.get('status')?.value;
    this.roleForm.get('status')?.setValue(!current);
  }

  onSubmit() {
    this.submitted = true;

    if (this.roleForm.invalid) {
      return;
    }

    const { roleName, status } = this.roleForm.value;

    const payload = {
      id: this.data?.id || '',
      name: roleName,
      isActive: status,
    };

    // ************ UPDATE CASE ************
    if (this.data?.id) {
      this.roleService
        .updateRoleRecord(payload)
        .pipe(
          catchError(() => {
            // Log FAILED Update
            this.activityLogger.logUpdate('Role', `Role update failed for ${roleName}`, payload.id, false);
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((response: any) => {
          if (response?.statusCode === 200) {
            this.toast.success(response.message);

            // Log SUCCESS Update
            this.activityLogger.logUpdate('Role', `Role updated successfully for ${roleName}`, payload.id, true);

            this.dialogRef.close(response);
          } else {
            // Log FAILED Update
            this.activityLogger.logUpdate('Role', `Role update failed for ${roleName}`, payload.id, false);
          }
        });

      return;
    }

    // ************ ADD / CREATE CASE ************
    this.roleService
      .addRolesRecord(payload)
      .pipe(
        catchError(() => {
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200 || response?.statusCode === 201) {
          this.toast.success(response.message);

          // Extract ID from backend response
          const createdId = response?.data?.id || '';
          this.dialogRef.close(response);
        } else {
        }
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
