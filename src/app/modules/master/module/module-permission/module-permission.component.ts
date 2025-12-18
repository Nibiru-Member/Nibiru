import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgStyle, CommonModule } from '@angular/common';
import { ModuleService } from 'src/app/core/services/module/module.service';
import { ModulePermision } from 'src/app/core/models/module.model';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-module-permission-dialog',
  templateUrl: './module-permission.component.html',
  styleUrl: './module-permission.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule, NgClass, NgStyle],
})
export class ModulePermissionComponent implements OnInit {
  permissionForm!: FormGroup;
  submitted: boolean = false;
  private activityLogger = inject(ActivityLoggerService);
  private toast = inject(ToasterService);
  private moduleService = inject(ModuleService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ModulePermissionComponent>) {}

  ngOnInit() {
    this.initForm();
    if (this.data?.permission?.id) {
      this.patchFormValue();
    }
  }

  initForm() {
    this.permissionForm = new FormGroup({
      action: new FormControl('', Validators.required),
      description: new FormControl(''),
      status: new FormControl(true, Validators.required),
    });
  }

  patchFormValue(): void {
    if (!this.data.permission) return;

    this.permissionForm.patchValue({
      action: this.data.permission?.action ?? '',
      description: this.data.permission?.description ?? '',
      status: this.data.permission?.isActive ?? true,
    });
  }

  get f() {
    return this.permissionForm.controls;
  }

  toggleStatus(): void {
    const current = this.permissionForm.get('status')?.value;
    this.permissionForm.get('status')?.setValue(!current);
  }

  onSubmit() {
    this.submitted = true;

    if (this.permissionForm.invalid) {
      return;
    }

    const { action, description, status } = this.permissionForm.value;
    const isEdit = !!this.data.permission?.id;
    const permissionId = this.data.permission?.id || '';
    const moduleId = this.data.moduleId;

    const payload: ModulePermision = {
      action: action,
      description: description,
      isActive: status,
      moduleId: moduleId,
      ...(isEdit && {
        id: permissionId,
        moduleId: this.data.permission?.moduleId,
      }),
    };

    if (isEdit) {
      // ================================
      //     UPDATE MODULE PERMISSION
      // ================================
      this.moduleService
        .updateModulePermissionRecord(payload)
        .pipe(
          catchError(() => {
            // LOG FAILED UPDATE
            this.activityLogger.logUpdate(
              'Module Permission',
              `Module permission update failed for action: ${action}`,
              permissionId,
              false,
            );

            this.toast.error('Failed to update permission');
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((response: any) => {
          if (response?.statusCode === 200) {
            this.toast.success(response.message);

            // LOG SUCCESS UPDATE
            this.activityLogger.logUpdate(
              'Module Permission',
              `Module permission updated successfully for action: ${action}`,
              permissionId,
              true,
            );

            this.dialogRef.close(response);
          } else {
            this.toast.error(response?.message || 'Failed to update permission');

            // LOG FAILED UPDATE
            this.activityLogger.logUpdate(
              'Module Permission',
              `Module permission update failed for action: ${action}`,
              permissionId,
              false,
            );
          }
        });
    } else {
      // ================================
      //         CREATE MODULE PERMISSION
      // ================================
      this.moduleService
        .addModulePermissionRecord(payload)
        .pipe(
          catchError(() => {
            this.toast.error('Failed to create permission');
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((response: any) => {
          if (response?.statusCode === 200 || response?.statusCode === 201) {
            const newId = response?.data?.id || '';

            this.toast.success(response.message);
            this.dialogRef.close(response);
          } else {
            this.toast.error(response?.message || 'Failed to create permission');
          }
        });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
