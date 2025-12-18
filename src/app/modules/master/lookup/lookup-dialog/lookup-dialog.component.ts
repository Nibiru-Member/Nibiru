import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgStyle, CommonModule } from '@angular/common';
import { LookupRecord } from 'src/app/core/models/lookup.model';
import { LookupService } from 'src/app/core/services/Lookup/lookup.service';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-lookup-dialog',
  templateUrl: './lookup-dialog.component.html',
  styleUrl: './lookup-dialog.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule, NgClass, NgStyle],
})
export class LookupDialogComponent implements OnInit {
  lookupForm!: FormGroup;
  submitted: boolean = false;

  private toast = inject(ToasterService);
  private lookupService = inject(LookupService);
  userData!: any;
  private activityLogger = inject(ActivityLoggerService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<LookupDialogComponent>) {}

  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.userData = JSON.parse(authUser);
    this.initForm();
    if (this.data?.lookUpId) {
      this.patchFormValue();
    }
  }

  initForm() {
    this.lookupForm = new FormGroup({
      lookUpName: new FormControl('', Validators.required),
      status: new FormControl(true, Validators.required),
    });
  }

  patchFormValue(): void {
    if (!this.data) return;

    this.lookupForm.patchValue({
      lookUpName: this.data?.lookUpName ?? '',
      status: this.data?.isActive ?? true,
    });
  }

  get f() {
    return this.lookupForm.controls;
  }

  toggleStatus(): void {
    const current = this.lookupForm.get('status')?.value;
    this.lookupForm.get('status')?.setValue(!current);
  }

  onSubmit() {
    this.submitted = true;

    if (this.lookupForm.invalid) {
      return;
    }

    const { lookUpName, status } = this.lookupForm.value;

    // Determine edit mode: 1 for edit, 0 for add
    const isEditMode = this.data?.lookUpId ? 1 : 0;

    const payload: LookupRecord = {
      lookUpName: lookUpName,
      userId: this.userData.userId,
      isActive: status,
      edit: isEditMode,
      ...(isEditMode && { lookUpId: this.data.lookUpId }),
    };

    this.lookupService
      .saveAndUpdateLookUp(payload)
      .pipe(
        catchError(() => {
          // FAILED LOG
          if (isEditMode) {
            this.activityLogger.logUpdate(
              'Lookup',
              `Lookup update failed for ${lookUpName}`,
              this.data.lookUpId,
              false,
            );
          } else {
          }

          this.toast.error(isEditMode ? 'Failed to update lookup' : 'Failed to create lookup');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200 || response?.statusCode === 201) {
          // SUCCESS LOG
          if (isEditMode) {
            this.activityLogger.logUpdate('Lookup', `Lookup updated successfully.`, this.data.lookUpId, true);
          } else {
            const newId = response?.data?.lookUpId || '';
          }

          this.toast.success(response.message);
          this.dialogRef.close(response);
        } else {
          // FAILED LOG
          if (isEditMode) {
            this.activityLogger.logUpdate(
              'Lookup',
              `Lookup update failed for ${lookUpName}`,
              this.data.lookUpId,
              false,
            );
          } else {
          }

          this.toast.error(response?.message || (isEditMode ? 'Failed to update lookup' : 'Failed to create lookup'));
        }
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
