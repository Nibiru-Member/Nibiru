import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './account-profile.component.html',
})
export class AccountProfileComponent implements OnInit, OnChanges {
  @Input() profileData: any;
  @Input() isEditMode = false;
  @Input() isFormValid = true;
  @Input() accountId = '';
  @Input() userId: any = '';

  @Output() formReference = new EventEmitter<NgForm>();
  @Output() profileUpdated = new EventEmitter<any>();
  @Output() profilePictureUploaded = new EventEmitter<{ file: File; dataUrl: string }>();

  @ViewChild('profileForm') profileForm!: NgForm;

  ngAfterViewInit() {
    this.formReference.emit(this.profileForm);
  }

  localProfileData: any = {};
  base64Image: string | null = null;
  isImageChanged = false;

  // Validation message holders
  phone1Error = '';
  phone2Error = '';
  emailError = '';

  newTag = '';

  constructor(private toastr: ToasterService) {}

  ngOnInit(): void {
    this.initializeProfileData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profileData']?.currentValue) {
      this.initializeProfileData();
    }
  }

  initializeProfileData(): void {
    this.localProfileData = {
      profilePicture: '',
      companyName: '',
      phone1: '',
      fax: '',
      tags: [],
      aboutCompany: '',
      email: '',
      phone2: '',
      website: '',
      ...this.profileData,
    };

    // Normalize tags
    if (typeof this.localProfileData.tags === 'string') {
      this.localProfileData.tags = this.localProfileData.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t);
    }

    if (!Array.isArray(this.localProfileData.tags)) {
      this.localProfileData.tags = [];
    }
  }
  onInputChange(): void {
    this.emitProfileData();
  }

  /** Add tag */
  addTag(event: any): void {
    event.preventDefault();
    const trimmed = this.newTag.trim();

    if (trimmed && !this.localProfileData.tags.includes(trimmed)) {
      this.localProfileData.tags.push(trimmed);
      this.emitProfileData();
    }

    this.newTag = '';
  }

  /** Add tag on comma */
  handleComma(event: KeyboardEvent): void {
    if (event.key === ',') {
      event.preventDefault();
      this.addTag(event);
    }
  }

  removeTag(index: number): void {
    this.localProfileData.tags.splice(index, 1);
    this.emitProfileData();
  }

  /** PHONE VALIDATION - Updated */
  validatePhone(field: 'phone1' | 'phone2'): void {
    const value: string = this.localProfileData[field] ?? '';
    const phonePattern = /^[0-9+\-\s()]*$/;

    let error = '';

    if (value && !phonePattern.test(value)) {
      error = 'Invalid phone number format';
    } else if (value.length > 15) {
      error = 'Phone number must not exceed 15 characters';
    }

    if (field === 'phone1') this.phone1Error = error;
    else this.phone2Error = error;

    this.emitProfileData();
  }

  /** EMAIL VALIDATION - Updated */
  validateEmail(): void {
    const email = this.localProfileData.email ?? '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    this.emailError = email && !emailPattern.test(email) ? 'Invalid email format' : '';

    this.emitProfileData();
  }

  /** Handling file uploads */
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 2 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];

    if (file.size > maxSize) {
      this.toastr.error('File too large (max 2MB)');
      return;
    }

    if (!allowed.includes(file.type)) {
      this.toastr.error('Invalid format — only JPG/PNG allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.localProfileData.profilePicture = data;
      this.isImageChanged = true;
      this.base64Image = data;

      this.profilePictureUploaded.emit({ file, dataUrl: data });
      this.emitProfileData();
    };

    reader.readAsDataURL(file);
  }

  onUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/jpg';
    input.style.display = 'none';
    input.onchange = (ev) => this.onFileChange(ev);
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  onReset(): void {
    this.base64Image = null;
    this.isImageChanged = false;
    this.localProfileData.profilePicture = '';
    this.emitProfileData();
  }

  /** Emits profile to parent */
  emitProfileData(): void {
    const apiData = {
      ...this.localProfileData,
      tags: Array.isArray(this.localProfileData.tags) ? this.localProfileData.tags.join(', ') : '',
    };

    this.profileUpdated.emit(apiData);
  }

  /** VALIDATE FULL FORM (Template-Driven Friendly) */
  validateForm(): boolean {
    const required = [
      this.localProfileData.companyName,
      this.localProfileData.phone1,
      this.localProfileData.aboutCompany,
      this.localProfileData.email,
      this.localProfileData.website,
    ];

    const missingRequired = required.some((v) => !v);

    const hasValidationErrors = !!this.phone1Error || !!this.phone2Error || !!this.emailError;

    return !(missingRequired || hasValidationErrors);
  }
}
