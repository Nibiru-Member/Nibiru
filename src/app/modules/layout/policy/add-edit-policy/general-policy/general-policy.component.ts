import { ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Subject, takeUntil, take } from 'rxjs';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { LookupService } from 'src/app/core/services/Lookup/lookup.service';
import { PolicyService } from 'src/app/core/services/Policy/policy.service';

@Component({
  selector: 'app-general-policy',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './general-policy.component.html',
})
export class GeneralPolicyComponent {
  /** Inputs/Outputs */
  @Input() category = '';
  @Output() categoryChange = new EventEmitter<string>();

  @Input() server = '';
  @Output() serverChange = new EventEmitter<string>();

  @Input() owner = '';
  @Output() ownerChange = new EventEmitter<string>();
  @Input() newCategory = '';
  @Output() newCategoryChange = new EventEmitter<string>();
  description = '';
  name = '';

  /** Lists */
  categoryList: any[] = [];
  ownerList: any[] = [];
  serverDetails: any[] = [];

  /** New Category textbox */
  newCategoryName = '';

  authUser: any;
  AccountId = '';

  private destroy$ = new Subject<void>();
  private serverService = inject(ServerService);
  private lookupService = inject(LookupService);
  private policyService = inject(PolicyService);
  private toast = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.authUser = JSON.parse(authUser);

    this.AccountId = this.authUser?.accountId || '';

    this.zone.run(() => {
      this.getServerConnectionByUser();
      this.getCategoryList();
      this.getOwnerList();
    });
  }

  /** CATEGORY LIST */
  getCategoryList() {
    this.policyService
      .GetPolicyCategory('Category')
      .pipe(take(1))
      .subscribe((res: any) => {
        if (res?.statusCode === 200) {
          this.categoryList = res.data || [];
        } else {
          this.toast.error('Failed to load categories');
        }
        this.cdr.detectChanges();
      });
  }

  /** OWNER LIST */
  getOwnerList() {
    this.policyService
      .GetOwnerList()
      .pipe(take(1))
      .subscribe((res: any) => {
        if (res?.statusCode === 200) {
          this.ownerList = res.data || [];
        } else {
          this.toast.error('Failed to load owners');
        }
        this.cdr.detectChanges();
      });
  }

  /** SERVER LIST */
  getServerConnectionByUser() {
    this.serverService
      .getServerConnectionByUser(this.authUser.userId, this.authUser.accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.serverDetails = res?.data || [];
          this.cdr.detectChanges();
        },
        error: () => this.toast.error('Failed to fetch server list'),
      });
  }

  /** ADD NEW CATEGORY */
  addNewCategory() {
    if (!this.newCategoryName.trim()) {
      this.toast.error('Please enter a category name');
      return;
    }
    const payload = {
      userId: this.authUser.userId,
      lookUpName: this.newCategoryName.trim(),
      isActive: true,
      lookUpId: '386bb966-c4c3-4f88-8ee5-1cd51581c0ac',
    };

    this.lookupService
      .saveAndUpdateSubLookUp(payload)
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          if (res?.statusCode === 201) {
            this.toast.success('Category added successfully');
            this.getCategoryList(); // Refresh category list
            this.category = res?.data?.value || '';
            this.categoryChange.emit(this.category);

            this.newCategoryName = '';
            this.cdr.detectChanges();
          } else {
            this.toast.error(res?.message || 'Failed to add category');
          }
        },
        error: () => this.toast.error('Failed to add category'),
      });
  }

  /** HELPERS */
  getOwnerLabel(id: string): string {
    const item = this.ownerList.find((o) => o.value === id);
    return item ? item.label : '';
  }

  getInitials(name: string): string {
    if (!name) return '';
    name = name.trim();
    if (name.length === 1) return name.toUpperCase();
    return name[0].toUpperCase() + name[name.length - 1].toUpperCase();
  }

  /** Handlers */
  onCategoryChange(v: string) {
    this.categoryChange.emit(v);
  }

  onServerChange(v: string) {
    this.serverChange.emit(v);
  }

  onOwnerChange(v: string) {
    this.owner = v;
    this.ownerChange.emit(v);
  }

  /** Parent Form Data Return */
  getFormData() {
    return {
      category: this.category,
      server: this.server,
      owner: this.owner,
      description: this.description,
      name: this.name,
    };
  }
  /** Validation */
  validate(): boolean {
    const categoryValid =
      (this.category && this.category !== '-- Choose a Category --') ||
      (this.newCategory && this.newCategory.trim() !== '');

    const serverValid = this.server && this.server !== '-- Choose a Server --';

    return !!(categoryValid && serverValid);
  }
}
