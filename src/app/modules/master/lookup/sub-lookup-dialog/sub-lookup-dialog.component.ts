import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgClass, NgStyle, CommonModule } from '@angular/common';
import { SubLookupRecord, LookupRecord } from 'src/app/core/models/lookup.model';
import { LookupService } from 'src/app/core/services/Lookup/lookup.service';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-sub-lookup-dialog',
  templateUrl: './sub-lookup-dialog.component.html',
  styleUrl: './sub-lookup-dialog.component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AngularSvgIconModule, NgClass, NgStyle],
})
export class SubLookupDialogComponent implements OnInit {
  subLookupForm!: FormGroup;
  submitted: boolean = false;
  private activityLogger = inject(ActivityLoggerService);

  private toast = inject(ToasterService);
  private lookupService = inject(LookupService);
  userData!: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SubLookupDialogComponent>) {}

  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.userData = JSON.parse(authUser);

    this.initForm();

    if (this.data?.subLookup?.subLookUpId) {
      this.patchFormValue();
    }
  }

  initForm() {
    this.subLookupForm = new FormGroup({
      name: new FormControl('', Validators.required),
      status: new FormControl(true, Validators.required),
    });
  }

  patchFormValue(): void {
    if (!this.data.subLookup) return;

    this.subLookupForm.patchValue({
      name: this.data.subLookup.lookUpName ?? '',
      status: this.data.subLookup.isActive ?? true,
    });
  }

  get f() {
    return this.subLookupForm.controls;
  }

  toggleStatus(): void {
    const current = this.subLookupForm.get('status')?.value;
    this.subLookupForm.get('status')?.setValue(!current);
  }

  onSubmit() {
    this.submitted = true;

    if (this.subLookupForm.invalid) return;

    const { name, status } = this.subLookupForm.value;
    const isEdit = !!this.data.subLookup?.subLookUpId;
    const subLookupId = this.data.subLookup?.subLookUpId || '';
    const lookUpId = this.data.subLookup?.lookUpId || this.data.lookUpId;

    const payload: SubLookupRecord = {
      lookUpId,
      lookUpName: name,
      userId: this.userData.userId,
      isActive: status,
      ...(isEdit && { subLookupId }),
    };

    this.lookupService
      .saveAndUpdateSubLookUp(payload)
      .pipe(
        catchError(() => {
          // FAILED LOG
          if (isEdit) {
            this.activityLogger.logUpdate('SubLookup', `SubLookup update failed for ${name}`, subLookupId, false);
          } else {
          }

          this.toast.error(isEdit ? 'Failed to update sub-lookup' : 'Failed to create sub-lookup');
          return EMPTY;
        }),
        take(1),
      )
      .subscribe((response: any) => {
        if (response?.statusCode === 200 || response?.statusCode === 201) {
          // SUCCESS LOG
          if (isEdit) {
            this.activityLogger.logUpdate('SubLookup', `SubLookup updated successfully for ${name}`, subLookupId, true);
          }
          this.toast.success(response.message);
          this.dialogRef.close(response);
        } else {
          // FAILED LOG
          if (isEdit) {
            this.activityLogger.logUpdate('SubLookup', `SubLookup update failed for ${name}`, subLookupId, false);
          } else {
          }

          this.toast.error(
            response?.message || (isEdit ? 'Failed to update sub-lookup' : 'Failed to create sub-lookup'),
          );
        }
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
