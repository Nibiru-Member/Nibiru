import { ChangeDetectorRef, Component, inject, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgZone } from '@angular/core';
import { GeneralPolicyComponent } from './general-policy/general-policy.component';
import { TargetPolicyComponent } from './target-policy/target-policy.component';
import { ThresholdPolicyComponent } from './threshold-policy/threshold-policy.component';
import { FilterPolicyComponent } from './filter-policy/filter-policy.component';
import { DefragmentPolicyComponent } from './defragment-policy/defragment-policy.component';
import { SchedulePolicyComponent } from './schedule-policy/schedule-policy.component';
import { ResourceCheckComponent } from './resource-check/resource-check.component';
import { NotificationPolicyComponent } from './notification-policy/notification-policy.component';

import { PolicyService } from 'src/app/core/services/Policy/policy.service';
import {
  Policy,
  UpdatePolicyThreshold,
  UpdatePolicyFilter,
  UpdatePolicyDefragment,
  UpdatePolicyNotifications,
  UpdatePolicySchedule,
  UpdatePolicyTargetSelection,
  Selection,
  UpdatePolicyResource,
} from 'src/app/core/models/policy.model';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ActivityLoggerService } from 'src/app/core/services/server/activity-logger.service';

@Component({
  selector: 'app-add-edit-policy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSvgIconModule,
    GeneralPolicyComponent,
    TargetPolicyComponent,
    ThresholdPolicyComponent,
    FilterPolicyComponent,
    DefragmentPolicyComponent,
    SchedulePolicyComponent,
    ResourceCheckComponent,
    NotificationPolicyComponent,
  ],
  templateUrl: './add-edit-policy.component.html',
  styleUrls: ['./add-edit-policy.component.css'],
})
export class AddEditPolicyComponent implements OnInit {
  tabs = ['General', 'Target', 'Threshold', 'Filters', 'Defragment', 'Schedule', 'Contention Check', 'Notifications'];
  activeTab = 0;
  isEditMode = false;
  isSaving = false;
  completedTabs: boolean[] = new Array(this.tabs.length).fill(false);

  // Shared data
  policyId: any | null = null;
  server = '';
  owner = '';
  newCategory = '';
  selectedItems: string[] = [];
  fragmentation = { enabled: true, value: 30, recommended: 30 };
  scanDensity = { enabled: false, value: 80, recommended: 80 };
  pageCountMin = 19;
  pageCountMax = 19;
  primaryIndexSorting = '';
  optimizeOption = '';
  updateStatistics = '';
  recompileProcedures = '';
  fillFactorCurrent = '';
  fillFactorNew = '';
  scheduleType = 'Monthly';
  startTime = '12:20:00 AM';
  selectedDays = [false, false, false, false, false, false, false];
  restrictionStart = '12:20:00 AM';
  restrictionEnd = '12:20:00 AM';
  emailAlerts = '';
  connectionUsername: string = '';
  connectionPassword: string = '';
  category: string = 'Local';
  isSchedule: boolean = false;
  // Child refs
  @ViewChild(GeneralPolicyComponent) generalComp!: GeneralPolicyComponent;
  @ViewChild(TargetPolicyComponent) targetComp!: TargetPolicyComponent;
  @ViewChild(ThresholdPolicyComponent) thresholdComp!: ThresholdPolicyComponent;
  @ViewChild(FilterPolicyComponent) filterComp!: FilterPolicyComponent;
  @ViewChild(DefragmentPolicyComponent) defragmentComp!: DefragmentPolicyComponent;
  @ViewChild(SchedulePolicyComponent) scheduleComp!: SchedulePolicyComponent;
  @ViewChild(NotificationPolicyComponent) notifyComp!: NotificationPolicyComponent;
  @ViewChild(ResourceCheckComponent) resourceCheckComp!: ResourceCheckComponent;
  private serverState = inject(ServerStateService);
  private activityLogger = inject(ActivityLoggerService);
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ngZone: NgZone,
    private policyService: PolicyService,
    private toast: ToasterService,
    public dialogRef: MatDialogRef<AddEditPolicyComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.policyId) {
      this.isEditMode = true;
      this.policyId = this.data.policyId;
      this.loadPolicyDetails(this.policyId);
    }
    const conn = this.serverState.getConnection?.();
    if (conn) {
      this.connectionUsername = conn.username || '';
      this.connectionPassword = conn.password || '';
    }
    this.cdr.detectChanges();
  }

  loadPolicyDetails(policyId: string): void {
    this.policyService.getPolicyDetailById(policyId).subscribe({
      next: (res) => {
        if (res?.data) {
          const policy = res.data;

          // Use ID, not name
          this.category = policy.categoryId;
          this.server = policy.serverName;
          this.owner = policy.ownerId;

          // Allow Angular input-binding to update child
          setTimeout(() => {
            if (this.generalComp) {
              this.generalComp.server = this.server;
              this.generalComp.owner = this.owner;
              this.generalComp.name = policy.name || '';
              this.generalComp.description = policy.description || '';
              this.cdr.detectChanges();
            }
          });
        }
      },
    });
  }

  validateCurrentTab(): boolean {
    switch (this.activeTab) {
      case 0:
        return this.generalComp?.validate();
      case 1:
        return this.targetComp?.validate();
      case 2:
        return this.thresholdComp?.validate();
      case 3:
        return this.filterComp?.validate();
      case 4:
        return this.defragmentComp?.validate();
      case 5:
        return this.scheduleComp?.validate();
      case 7:
        return this.notifyComp?.validate();
      default:
        return true;
    }
  }
  scrollToTop() {
    const modal = document.querySelector('.mat-dialog-container');
    if (modal) modal.scrollTop = 0;
  }
  /** Navigation logic — sequential step + async save before next */
  async nextStep() {
    const valid = this.validateCurrentTab();
    if (!valid) {
      this.toast.error('Please fill all required fields before proceeding.');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges(); // immediate refresh before awaiting API

    const saved = await this.saveCurrentTabData();

    // defer all UI-bound changes to next detection cycle
    setTimeout(() => {
      this.ngZone.run(() => {
        this.isSaving = false;
        if (saved) {
          this.completedTabs[this.activeTab] = true;
          if (this.activeTab < this.tabs.length - 1) {
            this.activeTab++;
            this.scrollToTop();
          } else {
            this.toast.info('All steps completed — review Notifications before Done.');
          }
        }
        this.cdr.detectChanges();
      });
    }, 0);
  }
  getObjectType(path: string): string {
    const parts = path.split('\\');
    return parts[1]; // second segment is always the folder/object type
  }

  getLeafName(path: string): string {
    const parts = path.split('\\');
    return parts[parts.length - 1]; // last segment
  }

  /** 🔹 Save data of current tab */
  async saveCurrentTabData(): Promise<boolean> {
    // Helper to get a friendly policy name (fall back to id)
    const getPolicyName = () => {
      try {
        return this.generalComp?.getFormData()?.category || `Policy`;
      } catch {
        return `Policy ${''}`;
      }
    };

    try {
      switch (this.activeTab) {
        case 0: {
          // CREATE (General)
          const general = this.generalComp.getFormData();
          const payload: Policy = {
            name: general.name,
            description: general.description,
            userId: this.getUserId(),
            serverName: general.server,
            policyId: this.isEditMode ? this.policyId : null,
            categoryId: general.category,
            ownerId: general.owner,
          };

          const res: any = await this.policyService.addPolicy(payload).toPromise();
          this.policyId = res?.data?.policyId;
          this.activityLogger.logUpdate('Policy', `Added for ${getPolicyName()}`, this.policyId || '', true);
          break;
        }

        case 1: {
          const target = this.targetComp.getFormData();

          // Validate at least one object selected
          const totalSelections = target.databases.reduce((sum: number, db: any) => sum + db.selections.length, 0);

          if (totalSelections === 0) {
            this.toast.warning('Please select at least one SQL object');
            return false;
          }

          const conn = this.serverState.getConnection();
          if (!conn || !conn.server) {
            this.toast.error('No active server connection found.');
            return false;
          }

          const payload: UpdatePolicyTargetSelection = {
            policyId: this.policyId!,
            accountId: this.getAccountId(),
            serverName: conn.server,
            isAllIndex: this.serverState.getIsAllIndex(),

            // NEW STRUCTURE
            databases: target.databases,
          };

          // Send final payload
          await this.policyService.updatePolicyTargetSelection(payload).toPromise();

          this.activityLogger.logUpdate('Policy', `Policy target selection updated`, this.policyId || '', true);

          break;
        }

        case 2: {
          // Threshold update
          const th = this.thresholdComp.getFormData();
          const payload: UpdatePolicyThreshold = {
            userId: this.getUserId(),
            policyId: this.policyId!,
            isFragmentation: th.fragmentation.enabled,
            fragmentationThreshold: th.fragmentation.value,
            isScanDensity: th.scanDensity.enabled,
            scanDensityThreshold: th.scanDensity.value,
          };

          await this.policyService.updatePolicyThreshold(payload).toPromise();

          // LOG UPDATE SUCCESS
          this.activityLogger.logUpdate(
            'Policy',
            `Policy threshold updated for ${getPolicyName()}`,
            this.policyId || '',
            true,
          );

          break;
        }

        case 3: {
          // Filter update
          const f = this.filterComp.getFormData();
          const payload: UpdatePolicyFilter = {
            userId: this.getUserId(),
            policyId: this.policyId!,
            isMinPageCount: f.pageCountMin > 0,
            minPageCount: f.pageCountMin,
            isMaxPageCount: f.pageCountMax > 0,
            maxPageCount: f.pageCountMax,
            primaryIndexSorting: f.primaryIndexSorting,
          };

          await this.policyService.updatePolicyFilter(payload).toPromise();

          // LOG UPDATE SUCCESS
          this.activityLogger.logUpdate(
            'Policy',
            `Policy filter updated for ${getPolicyName()}`,
            this.policyId || '',
            true,
          );

          break;
        }

        case 4: {
          // Defragment update
          const d = this.defragmentComp.getFormData();
          const payload: UpdatePolicyDefragment = {
            userId: this.getUserId(),
            policyId: this.policyId!,
            isReorganize: d.optimizeOption === 'reorganize',
            isRebuildOnline: d.optimizeOption === 'rebuild',
            updateStatistics: d.updateStatistics,
            statisticsMethod: d.statisticsMethod,
            useNoRecompute: d.useNoRecompute,
            updateRecompiledSP: d.recompileProcedures,
            fillFactorCurrentValue: d.fillFactorCurrent,
            fillFactorNewValue: d.fillFactorNew,
            isIndex: d.isIndex,
            isMdf: d.isMdf,
            isIndexMDF: d.isIndexMdf,
            isBackup: d.isBackup,
            isAutomate: d.isAutomate,
          };

          await this.policyService.updatePolicyDefragment(payload).toPromise();

          // LOG UPDATE SUCCESS
          this.activityLogger.logUpdate(
            'Policy',
            `Policy defragment settings updated for ${getPolicyName()}`,
            this.policyId || '',
            true,
          );

          break;
        }

        case 5: {
          // Schedule update
          const s = this.scheduleComp.getFormData();
          const payload: UpdatePolicySchedule = {
            userId: this.getUserId(),
            policyId: this.policyId!,
            scheduleType: s.scheduleType,
            scheduleStartTime: s.startTime,
            onSunday: s.selectedDays[0],
            onMonday: s.selectedDays[1],
            onTuesday: s.selectedDays[2],
            onWednesday: s.selectedDays[3],
            onThursday: s.selectedDays[4],
            onFriday: s.selectedDays[5],
            onSaturday: s.selectedDays[6],
            restrictionStartTime: s.restrictionStart,
            restrictionEndTime: s.restrictionEnd,
            isSchedule: s.isSchedule,
          };

          await this.policyService.updatePolicySchedule(payload).toPromise();

          // LOG UPDATE SUCCESS
          this.activityLogger.logUpdate(
            'Policy',
            `Policy schedule updated for ${getPolicyName()}`,
            this.policyId || '',
            true,
          );

          break;
        }

        case 7: {
          // Notifications update
          const n = this.notifyComp.getFormData();
          const payload: UpdatePolicyNotifications = {
            userId: this.getUserId(),
            policyId: this.policyId!,
            policyStarted: n.selectedNotifications.includes('Started'),
            policyCompleted: n.selectedNotifications.includes('Completed'),
            policyCanceled: n.selectedNotifications.includes('Canceled'),
            policyExpired: n.selectedNotifications.includes('Expired'),
            policyDisabled: n.selectedNotifications.includes('Disabled'),
            policyFailed: n.selectedNotifications.includes('Failed'),
            policyDelayed: n.selectedNotifications.includes('Delayed'),
            emailRecipients: n.emailAlerts,
          };

          await this.policyService.updatePolicyNotifications(payload).toPromise();

          // LOG UPDATE SUCCESS
          this.activityLogger.logUpdate(
            'Policy',
            `Policy notifications updated for ${getPolicyName()}`,
            this.policyId || '',
            true,
          );

          break;
        }

        // default - nothing to save
        default:
          break;
      }

      this.toast.success(`${this.tabs[this.activeTab]} saved successfully`);
      return true;
    } catch (err) {
      console.error(err);

      const tabLabel = this.tabs[this.activeTab] || `Tab ${this.activeTab}`;
      const policyName = (() => {
        try {
          return this.generalComp?.getFormData()?.category || `Policy ${this.policyId || ''}`;
        } catch {
          return `Policy ${this.policyId || ''}`;
        }
      })();

      // If it was the create (tab 0) — log create failure; otherwise log update failure
      if (this.activeTab === 0) {
      } else {
        this.activityLogger.logUpdate(
          'Policy',
          `Policy ${tabLabel} save failed for ${policyName}`,
          this.policyId || '',
          false,
        );
      }

      this.toast.error(`Failed to save ${this.tabs[this.activeTab]} data`);
      return false;
    }
  }

  previousStep() {
    if (this.activeTab > 0) this.activeTab--;
  }

  /** ✅ Fix: add missing onDone */
  onDone() {
    const valid = this.validateCurrentTab();
    if (!valid) {
      this.toast.warning('Please complete all required fields before finishing.');
      return;
    }

    this.saveCurrentTabData().then((saved) => {
      if (saved) {
        const policyName = this.generalComp?.getFormData()?.category || 'Policy';
        const policyId = this.policyId;

        if (this.isEditMode) {
          // UPDATE SUCCESS LOG
          this.activityLogger.logUpdate('Policy', `Policy updated successfully.`, policyId, true);
        } else {
          // (Only if final save created it — add logs only in case 0 earlier)
        }

        this.ngZone.run(() => {
          this.toast.success(this.isEditMode ? 'Policy updated successfully!' : 'Policy created successfully!');
          this.dialogRef.close(true);
        });
      } else {
        // UPDATE/FINAL SAVE FAILURE LOG
        const policyName = this.generalComp?.getFormData()?.category || 'Policy';
        const policyId = this.policyId;

        this.activityLogger.logUpdate('Policy', `Policy update failed for ${policyName}`, policyId, false);
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  public getUserId(): string {
    const auth = localStorage.getItem('authObj');
    if (auth) {
      try {
        const u = JSON.parse(auth);
        return u?.userId || u?.user?.userId;
      } catch {
        return '';
      }
    }
    return '';
  }
  private getAccountId(): string {
    const auth = localStorage.getItem('authObj');
    if (auth) {
      try {
        const u = JSON.parse(auth);
        return u?.accountId;
      } catch {
        return '';
      }
    }
    return '';
  }
}
