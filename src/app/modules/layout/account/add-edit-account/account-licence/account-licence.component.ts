import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-account-licence',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule],
  templateUrl: './account-licence.component.html',
})
export class AccountLicenceComponent implements OnInit, OnChanges {
  @Input() licenseData: any;
  @Input() isFormValid: boolean = true;
  @Output() licenseUpdated = new EventEmitter<any>();
  @Output() formReference = new EventEmitter<NgForm>();

  @ViewChild('licenseForm') licenseForm!: NgForm;

  ngAfterViewInit() {
    this.formReference.emit(this.licenseForm);
  }

  localLicenseData: any = {};
  dateError = '';

  ngOnInit(): void {
    this.initializeLicenseData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['licenseData'] && changes['licenseData'].currentValue) {
      this.initializeLicenseData();
    }
  }

  initializeLicenseData(): void {
    this.localLicenseData = {
      noOfUsers: 0,
      noOfInstances: 0,
      noOfDatabases: 0,
      licenseType: '',
      licenseStartDate: '',
      licenseEndDate: '',
      price: '',
      ...this.licenseData,
    };
  }

  onInputChange(): void {
    this.emitLicenseData();
  }

  onDateChange(): void {
    this.validateDates();
    this.emitLicenseData();
  }

  validateDates(): void {
    this.dateError = '';
    const { licenseStartDate, licenseEndDate } = this.localLicenseData;

    if (licenseStartDate && licenseEndDate) {
      const startDate = new Date(licenseStartDate);
      const endDate = new Date(licenseEndDate);

      if (endDate <= startDate) {
        this.dateError = 'End Date must be after Start Date';
      }
    }
  }

  validateForm(): boolean {
    const requiredFields = [
      'noOfUsers',
      'noOfInstances',
      'noOfDatabases',
      'licenseType',
      'licenseStartDate',
      'licenseEndDate',
      'price',
    ];

    const isValid = requiredFields.every((field) => {
      if (field.startsWith('noOf')) return this.localLicenseData[field] > 0;
      return !!this.localLicenseData[field];
    });

    // Date validation check
    if (isValid && this.localLicenseData.licenseStartDate && this.localLicenseData.licenseEndDate) {
      const startDate = new Date(this.localLicenseData.licenseStartDate);
      const endDate = new Date(this.localLicenseData.licenseEndDate);
      if (endDate <= startDate) {
        this.dateError = 'End Date must be after Start Date';
        return false;
      }
    }

    return isValid;
  }

  emitLicenseData(): void {
    this.licenseUpdated.emit({ ...this.localLicenseData });
  }
}
