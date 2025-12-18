import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgStyle, CommonModule } from '@angular/common';
import { ModuleService } from 'src/app/core/services/module/module.service';
import { ModuleRecord } from 'src/app/core/models/module.model';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-module-dialog',
  templateUrl: './module-dialog.component.html',
  styleUrl: './module-dialog.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule, NgClass, NgStyle],
})
export class ModuleDialogComponent implements OnInit {
  moduleForm!: FormGroup;
  submitted: boolean = false;

  private toast = inject(ToasterService);
  private moduleService = inject(ModuleService);
  private activityLogger = inject(ActivityLoggerService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ModuleDialogComponent>) {}

  ngOnInit() {
    this.initForm();
    if (this.data?.id) {
      this.patchFormValue();
    }
  }

  initForm() {
    this.moduleForm = new FormGroup({
      moduleName: new FormControl('', Validators.required),
      moduleDescription: new FormControl(''),
      status: new FormControl(true, Validators.required),
    });
  }

  patchFormValue(): void {
    if (!this.data) return;

    this.moduleForm.patchValue({
      moduleName: this.data?.moduleName ?? '',
      moduleDescription: this.data?.description ?? '',
      status: this.data?.isActive ?? true,
    });
  }

  get f() {
    return this.moduleForm.controls;
  }

  toggleStatus(): void {
    const current = this.moduleForm.get('status')?.value;
    this.moduleForm.get('status')?.setValue(!current);
  }

  onSubmit() {
    this.submitted = true;

    if (this.moduleForm.invalid) {
      return;
    }

    const { moduleName, moduleDescription, status } = this.moduleForm.value;
    const isEditMode = !!this.data?.id;
    const moduleId = this.data?.id || '';

    const payload = {
      id: moduleId,
      moduleName: moduleName,
      description: moduleDescription,
      isActive: status,
    };

    if (isEditMode) {
      // ================================
      //     UPDATE MODULE
      // ================================
      this.moduleService
        .updateModuleRecord(payload)
        .pipe(
          catchError(() => {
            // LOG FAILURE
            this.activityLogger.logUpdate('Module', `Module update failed for ${moduleName}`, moduleId, false);

            this.toast.error('Failed to update module');
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((response: any) => {
          if (response?.statusCode === 200) {
            this.toast.success(response.message);

            // LOG SUCCESS
            this.activityLogger.logUpdate('Module', `Module updated successfully for ${moduleName}`, moduleId, true);

            this.dialogRef.close(response);
          } else {
            this.toast.error(response?.message || 'Failed to update module');

            // LOG FAILURE
            this.activityLogger.logUpdate('Module', `Module update failed for ${moduleName}`, moduleId, false);
          }
        });
    } else {
      // ================================
      //     CREATE MODULE
      // ================================
      this.moduleService
        .addModuleRecord(payload)
        .pipe(
          catchError((error: any) => {
            // LOG FAILURE
            // BACKEND VALIDATION ERRORS
            if (error?.error?.errors) {
              const firstKey = Object.keys(error.error.errors)[0];
              const firstMessage = error.error.errors[firstKey]?.[0];
              this.toast.error(firstMessage || 'Validation failed');
            } else {
              this.toast.error(error?.error?.title || 'Failed to create module');
            }
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((response: any) => {
          if (response?.statusCode === 200 || response?.statusCode === 201) {
            const newModuleId = response?.data?.id || '';

            this.toast.success(response?.message || 'Module created successfully');
            this.dialogRef.close(response);
          } else if (response?.errors) {
            const firstKey = Object.keys(response.errors)[0];
            const firstMessage = response.errors[firstKey]?.[0];
            this.toast.error(firstMessage || response?.title || 'Failed to create module');
          } else {
            this.toast.error(response?.title || 'Failed to create module');
          }
        });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
