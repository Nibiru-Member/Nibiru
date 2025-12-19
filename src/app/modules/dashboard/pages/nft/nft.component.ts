import { Component, inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { EMPTY, Subscription, forkJoin, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexGrid,
  ApexPlotOptions,
  ApexYAxis,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { ServerService } from 'src/app/core/services/server/server.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ServerComponent } from 'src/app/shared/dialogs/server/server.component';
import { MatDialog } from '@angular/material/dialog';
import { DynamicBreadcrumbComponent } from 'src/app/shared/components/dynamic-breadcrumb/dynamic-breadcrumb.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ActiveHistoryService } from 'src/app/core/services/active-history.service';
import { DialogBackupComponent } from 'src/app/modules/layout/policy/add-edit-policy/defragment-policy/dialog-backup/dialog-backup.component';
import { DialogbackupListComponent } from './dialogbackup-list/dialogbackup-list.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { BackupConfirmationComponent } from 'src/app/shared/dialogs/backup-confirmation/backup-confirmation.component';
import { Overlay } from '@angular/cdk/overlay';
import { TakeOfflineDialogComponent } from './take-offline-dialog/take-offline-dialog.component';
import { DefragmentTablesComponent } from './defragment-tables/defragment-tables.component';

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  markers: ApexMarkers;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  yaxis: ApexYAxis;
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  fill: ApexFill;
  stroke: ApexStroke;
  // optional theme/responsive/title types omitted for brevity
};

@Component({
  selector: 'app-nft',
  templateUrl: './nft.component.html',
  imports: [CommonModule, FormsModule, NgApexchartsModule, DynamicBreadcrumbComponent, AngularSvgIconModule],
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))]),
    ]),
  ],
})
export class NftComponent implements OnInit, OnDestroy {
  // auth + ui

  menu = { visible: false, x: 0, y: 0, row: null as any };
  isOffline = false;

  authUser!: AuthResponse;
  public forgeryToken: string = '';
  diskStorage: any[] = [];
  serverName = 'Servers';
  periods = ['DAILY', 'WEEKLY', 'MONTHLY'];
  selectedPeriod = 'WEEKLY';
  noFragmentationData = false;
  isTotalIndexApiCalled = false;
  // DI
  private authService = inject(AuthService);
  private activeHistoryService = inject(ActiveHistoryService);
  private toaster = inject(ToasterService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  // Data holders (view-bound)
  ServerList: any;
  mdfFiles: any[] = [];
  indexFilesReviews: any[] = [];
  fillFactorHistory: any[] = [];
  indexStorageUtilization: any[] = [];
  fragmentedIndexes: any[] = [];
  fillFactorData: any[] = [];
  totalFragmentationData: any[] = [];
  totalIndexFragmentationData: any[] = [];

  // charts
  fillFactorChartOptions!: LineChartOptions | undefined;
  totalFragmentationChartOptions!: BarChartOptions | undefined;
  totalIndexFragmentationChartOptions!: BarChartOptions | undefined;
  // subscriptions
  private subs: Subscription[] = [];
  activityList: any[] = [];
  // flags for gating
  dashboardLoading = false;
  dashboardReady = false;
  showDashboard = false;
  openMenuIndex: number | null = null;
  openSubMenu: string | null = null;
  activityModuleName: any;
  noFragmentation: any;
  ServerHealthStatus: any;

  constructor(private dashboardSvc: ServerService, public serverState: ServerStateService, private overlay: Overlay) {}

  ngOnInit(): void {
    const forgeryToken = localStorage.getItem('forgeryToken');
    if (!forgeryToken) {
      this.getForgeryToken();
    } else {
      this.initCalls();
    }
  }

  loadActivityHistory(): void {
    this.activeHistoryService
      .GetActivityHistoryList()
      .pipe(
        catchError((err) => {
          console.error('Activity history error', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.activityList = res.data.map((item: any) => ({
            status: item.activityStatus, // A, U, etc.
            activityModuleName: item.activityModuleName,
            user: item.activityByName,
            timeAgo: this.getRelativeTime(item.activityTime),
            description: item.activityDescription,
          }));
        } else {
          this.activityList = [];
        }

        this.cdr.markForCheck();
      });
  }
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }
  // backupMdfFile(row: any): void {
  //   if (!row.mdfFiles) {
  //     console.warn('No selected database found in ServerStateService.');
  //     return;
  //   }
  //   // Step 1: open dialog INSTEAD of BackupDatabase API
  //   const dialogRef = this.dialog.open(DialogBackupComponent, {
  //     disableClose: true,
  //     width: '560px',
  //     data: {},
  //   });

  //   dialogRef
  //     .afterClosed()
  //     .pipe(
  //       switchMap((dialogResult: any) => {
  //         const mdfFilePath = dialogResult?.data.backupPath;
  //         if (!mdfFilePath) {
  //           console.warn('Dialog did not return backupFileName.');
  //           return EMPTY;
  //         }

  //         const defragPayload = {
  //           databaseName: row.mdfFiles || '',
  //           mdfFilePath: row.location, // from dialog
  //           backupPath: mdfFilePath,
  //         };

  //         // Step 3: Everything else remains same
  //         return this.dashboardSvc.DefragmentMDF(defragPayload);
  //       }),
  //     )
  //     .subscribe({
  //       next: (defragRes: any) => {
  //         const logId = defragRes?.data?.logId || (defragRes as any)?.logId || null;

  //         if (!logId) {
  //           console.warn('DefragmentMDF did not return logId.');
  //           return;
  //         }

  //         this.dialog.open(DialogbackupListComponent, {
  //           height: '400px',
  //           data: { logId: logId },
  //           panelClass: 'custom-dark-dialog',
  //         });
  //       },
  //       error: (err) => {
  //         console.error('Defragment flow failed', err);
  //       },
  //     });
  // }
  backupMdfFile(row: any): void {
    // ✅ Safety check
    if (!row?.mdfFiles) {
      console.warn('No selected database found.');
      return;
    }

    // ✅ STEP 1: Open Confirmation Dialog
    const confirmDialogRef = this.dialog.open(BackupConfirmationComponent, {
      disableClose: true,
      data: {},
    });

    confirmDialogRef.afterClosed().subscribe((confirmResult: boolean) => {
      // ✅ If user CANCELS → STOP HERE
      if (!confirmResult) {
        console.log('Backup cancelled by user.');
        return;
      }

      // ✅ STEP 2: Open Backup Path Dialog
      const backupDialogRef = this.dialog.open(DialogBackupComponent, {
        disableClose: true,
        width: '560px',
        data: row,
        scrollStrategy: this.overlay.scrollStrategies.block(),
      });

      backupDialogRef
        .afterClosed()
        .pipe(
          switchMap((dialogResult: any) => {
            const backupPath = dialogResult?.data?.backupPath;

            if (!backupPath) {
              console.warn('Dialog did not return backupPath.');
              return EMPTY;
            }

            // ✅ STEP 3: Prepare Payload
            const defragPayload = {
              databaseName: row.mdfFiles,
              mdfFilePath: row.location,
              backupPath: backupPath,
            };

            // ✅ STEP 4: Call API
            return this.dashboardSvc.DefragmentMDF(defragPayload);
          }),
        )
        .subscribe({
          next: (defragRes: any) => {
            const logId = defragRes?.data?.logId || defragRes?.logId || null;

            if (!logId) {
              console.warn('DefragmentMDF did not return logId.');
              return;
            }

            // ✅ STEP 5: Open Backup Log Dialog
            this.dialog.open(DialogbackupListComponent, {
              height: '400px',
              data: { logId },
              panelClass: 'custom-dark-dialog',
            });
          },
          error: (err) => {
            console.error('Defragment flow failed', err);
          },
        });
    });
  }

  getStatusTitle(status: string): string {
    switch (status) {
      case 'S':
        return 'Save';
      case 'U':
        return 'Updated';
      case 'D':
        return 'Deleted';
      default:
        return 'Activity';
    }
  }

  openMenu(event: MouseEvent, row: any) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menu.y = rect.bottom + window.scrollY;
    this.menu.x = rect.left + window.scrollX;
    this.menu.row = row;
    this.menu.visible = true;
  }

  closeMenu() {
    this.menu.visible = false;
    this.menu.row = null;
  }
  private getForgeryToken(): void {
    this.authService
      .getAntiForgeryToken()
      .pipe(
        catchError(() => {
          return of(null);
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res && res.token) {
          this.forgeryToken = res.token;
          localStorage.setItem('forgeryToken', JSON.stringify(this.forgeryToken));
        } else {
          this.toaster.error(res?.data ? res.data.message : res?.message || 'Failed to get token');
        }
        // initialise regardless: initCalls will guard for token usage as needed
        this.initCalls();
      });
  }

  initCalls() {
    const authUser = JSON.parse(localStorage.getItem('authObj') || '{}');
    this.authUser = authUser;
    this.ServerList = authUser.serverList || [];
    // Open Connect to Server dialog directly on login
    const hasOpenedServerDialog = localStorage.getItem('ServerDialogOpened') === 'true';
    if (!hasOpenedServerDialog) {
      const dialogRef = this.dialog.open(ServerComponent, { disableClose: true });
      localStorage.setItem('ServerDialogOpened', 'true');
      dialogRef.afterClosed().subscribe(() => {});
    }
    this.loadMdfFiles(this.selectedPeriod);
    // load disk storage on init if connection present
    this.loadDiskStorage();
    this.GetServerHealthStatus();
    // Subscribe to DB selection changes but only react after DB list loaded
    const dbSub = this.serverState
      .onSelectedDatabaseChange()
      .pipe(debounceTime(60), distinctUntilChanged())
      .subscribe((dbName) => {
        // ignore until DB list loaded & connection present
        if (!this.serverState.isDatabaseListLoaded()) return;

        const conn = this.serverState.getConnection();
        if (!conn) {
          this.resetDashboardState();
          return;
        }

        // load dashboard for selected DB (this method itself gates index APIs)
        this.loadAllForCurrent(dbName, this.selectedPeriod);
      });

    this.subs.push(dbSub);

    // Listen to explicit index-refresh signals (fired when user clicks an index leaf)
    const idxSub = this.serverState.onIndexRefresh().subscribe(() => {
      const db = this.serverState.getSelectedDatabase();
      this.loadAllForCurrent(db || '', this.selectedPeriod);
    });

    this.subs.push(idxSub);

    // if a DB is already selected and DB list loaded, trigger initial load
    if (this.serverState.isDatabaseListLoaded()) {
      const selected = this.serverState.getSelectedDatabase();
      if (selected) {
        this.loadAllForCurrent(selected, this.selectedPeriod);
      }
    }
    this.loadActivityHistory();
  }

  toggleMenu(i: number) {
    this.openMenuIndex = this.openMenuIndex === i ? null : i;
    this.openSubMenu = null;
  }

  toggleSubMenu(menu: string) {
    this.openSubMenu = this.openSubMenu === menu ? null : menu;
  }

  // Reset dashboard when connection removed or DB invalid
  private resetDashboardState() {
    this.indexFilesReviews = [];
    this.fillFactorHistory = [];
    this.indexStorageUtilization = [];
    this.fragmentedIndexes = [];
    this.fillFactorData = [];
    this.totalFragmentationData = [];
    this.totalIndexFragmentationData = [];
    this.fillFactorChartOptions = undefined;
    this.totalFragmentationChartOptions = undefined;
    this.totalIndexFragmentationChartOptions = undefined;
    this.dashboardLoading = false;
    this.dashboardReady = false;
    this.showDashboard = false;
    this.cdr.markForCheck();
  }

  private resetIndexDashboardState() {
    this.indexFilesReviews = [];
    this.fillFactorHistory = [];
    this.indexStorageUtilization = [];
    this.totalIndexFragmentationData = [];
    this.totalIndexFragmentationChartOptions = undefined;
    this.cdr.markForCheck();
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    const db = this.serverState.getSelectedDatabase();
    this.loadMdfFiles(this.selectedPeriod);
    this.loadAllForCurrent(db || '', this.selectedPeriod);
  }

  private mapPeriodToApi(period: string): string {
    switch (period.toUpperCase()) {
      case 'DAILY':
        return 'Daily';
      case 'MONTHLY':
        return 'Monthly';
      default:
        return 'Weekly';
    }
  }

  loadAllForCurrent(databaseName: any | null, selectedPeriod: string) {
    // guard
    // const conn = this.serverState.getConnection();
    // if (!conn) {
    //   this.resetDashboardState();
    //   return;
    // }

    // Determine whether an index is selected right now
    const indexName = this.serverState.getSelectedIndexName();
    if (!indexName) {
      // Clear only index-related UI and proceed to call the non-index APIs.
      this.resetIndexDashboardState();
    }
    this.loadMdfFiles(this.selectedPeriod);
    const apiPeriod = this.mapPeriodToApi(selectedPeriod);

    // set loading state (UI uses these flags)
    this.dashboardLoading = true;
    this.dashboardReady = false;
    this.showDashboard = false;
    this.cdr.markForCheck();

    const index$ = this.dashboardSvc.getTopFragmentedIndex(databaseName || '', apiPeriod).pipe(
      catchError((err) => {
        console.error('Index API err', err);
        return of(null);
      }),
    );
    const fill$ = databaseName
      ? this.dashboardSvc.getFillFactorCorrection(databaseName, apiPeriod).pipe(
          catchError((err) => {
            console.error('Fill API err', err);
            return of(null);
          }),
        )
      : of(null); // DB not selected → do not call API

    const total$ = this.dashboardSvc.getTotalFragmentation(databaseName || '', apiPeriod).pipe(
      catchError((err) => {
        console.error('Total API err', err);
        return of(null);
      }),
    );

    let indexReview$: any = of(null);
    let indexStorageUtili$: any = of(null);
    let fillFactorHistory$: any = of(null);
    let totalIndex$: any = of(null);

    // CASE 1: No Database → call nothing (leave all as of(null))
    if (!databaseName) {
      // do nothing — all 4 observables remain not called
    }

    // CASE 2: Database selected but NO index selected → call 2 APIs
    else if (databaseName && !indexName) {
      indexReview$ = this.dashboardSvc
        .GetIndexFilesReview(databaseName, this.serverState.getSelectedTableName() || '', '', apiPeriod)
        .pipe(catchError(() => of(null)));

      indexStorageUtili$ = this.dashboardSvc
        .GetIndexStorageUtilization(databaseName, this.serverState.getSelectedTableName() || '', '', apiPeriod)
        .pipe(catchError(() => of(null)));
    }

    // CASE 3: Database selected AND index selected → call all 4 APIs
    else if (databaseName && indexName) {
      indexReview$ = this.dashboardSvc
        .GetIndexFilesReview(databaseName, this.serverState.getSelectedTableName() || '', indexName, apiPeriod)
        .pipe(catchError(() => of(null)));

      indexStorageUtili$ = this.dashboardSvc
        .GetIndexStorageUtilization(databaseName, this.serverState.getSelectedTableName() || '', indexName, apiPeriod)
        .pipe(catchError(() => of(null)));

      fillFactorHistory$ = this.dashboardSvc
        .GetIndexFillFactoryHistory(databaseName, this.serverState.getSelectedTableName() || '', indexName, apiPeriod)
        .pipe(catchError(() => of(null)));

      totalIndex$ = this.dashboardSvc
        .GetTotalIndexFragmentation(databaseName, this.serverState.getSelectedTableName() || '', indexName, apiPeriod)
        .pipe(catchError(() => of(null)));
    }

    // Build request object for forkJoin so keys are stable even when optional ones are absent
    const reqs: any = {
      indexList: index$,
      fill: fill$,
      total: total$,
    };

    // Only attach ANY index APIs if database exists
    if (databaseName) {
      // add DB + no-index APIs
      reqs.indexReview = indexReview$;
      reqs.indexStorage = indexStorageUtili$;

      // add index-only APIs only if index selected
      if (indexName) {
        reqs.fillFactorHistory = fillFactorHistory$;
        reqs.totalIndex = totalIndex$;
      }
    }

    const sub = forkJoin(reqs).subscribe((res: any) => {
      let anySuccess = false;
      // Index Review Files (index-specific, may be absent)
      const indexFilesReviewRes = res.indexReview;

      if (indexFilesReviewRes && indexFilesReviewRes.success && Array.isArray(indexFilesReviewRes.data)) {
        this.indexFilesReviews = indexFilesReviewRes.data.map((m: any) => ({
          table: m.table,
          index: m.index,
          indexType: m.indexType,
          cluster: m.cluster,
          sortedPercent: m.sorted, // e.g., "0.00%"
          columnsIndexed: m.columnsIndexed,
          sizeKB: m.size, // e.g., "2768 KB"
          rows: Number(m.rows),
          pages: Number(m.pages),
          fragmentationPercent: Number(m.fragmentation),
          fillFactor: Number(m.fillFactor),
          defragmentationStatus: m.defragmentationStatus,
        }));

        anySuccess = true;
      } else {
        if (!indexName) {
          this.indexFilesReviews = [];
        }
      }

      // IndexFill Factor History (index-specific)
      const fillFactorHistoryRes = res.fillFactorHistory;
      if (fillFactorHistoryRes && fillFactorHistoryRes.success && Array.isArray(fillFactorHistoryRes.data)) {
        this.fillFactorHistory = fillFactorHistoryRes.data.map((m: any) => ({
          action: m.action,
          fillFactorPercent: m.fillFactorPercent,
          fragChange: m.fragChange,
          fragPercent: m.fragPercent,
          index: m.index,
          started: m.started,
        }));
        anySuccess = true;
      } else {
        if (!indexName) {
          this.fillFactorHistory = [];
        }
      }

      // Index Storage Utilization (index-specific)
      const indexStorageUtiliRes = res.indexStorage;

      if (indexStorageUtiliRes && Array.isArray(indexStorageUtiliRes.data)) {
        this.indexStorageUtilization = indexStorageUtiliRes.data.map((m: any) => ({
          tableName: m.tableName,
          indexName: m.indexName,
          totalSizeKB: Number(m.totalSizeKB),
          sizeFormatted: this.formatSize(Number(m.totalSizeKB) / 1024),
          avgFragmentationPercent: Number(m.avgFragmentationPercent),
          totalPages: Number(m.totalPages),
          maxLevels: Number(m.maxLevels),
        }));

        anySuccess = true;
      } else {
        this.indexStorageUtilization = [];
      }

      // Indexes (top fragmented indexes)
      const indexRes = res.indexList;
      if (indexRes && indexRes.success && Array.isArray(indexRes.data)) {
        this.fragmentedIndexes = indexRes.data;
        anySuccess = true;
      } else {
        this.fragmentedIndexes = [];
      }

      // Fill factor (charts)
      const fillRes = res.fill;
      if (fillRes && fillRes.success && Array.isArray(fillRes.data)) {
        this.fillFactorData = fillRes.data;
        this.buildFillFactorChart(fillRes.data);
        anySuccess = true;
      } else {
        this.fillFactorData = [];
        this.buildFillFactorChart([]);
      }

      // Total fragmentation (DB-level)
      const totalRes = res.total;
      if (totalRes && totalRes.success && Array.isArray(totalRes.data)) {
        this.totalFragmentationData = totalRes.data;
        this.buildTotalFragmentationChart(totalRes.data);
        anySuccess = true;
      } else {
        this.totalFragmentationData = [];
        this.buildTotalFragmentationChart([]);
      }

      // Total index fragmentation (index specific)
      const totalIndexRes = res.totalIndex;
      if (totalIndexRes && totalIndexRes.success && Array.isArray(totalIndexRes.data)) {
        this.totalIndexFragmentationData = totalIndexRes.data;
        this.buildTotalIndexFragmentationChart(totalIndexRes.data);
        anySuccess = true;
      } else {
        if (!indexName) {
          this.totalIndexFragmentationData = [];
          this.buildTotalIndexFragmentationChart([]);
        }
      }

      // finalize flags & update UI once
      this.dashboardLoading = false;
      this.dashboardReady = anySuccess;
      this.showDashboard = this.dashboardReady && this.serverState.isDatabaseListLoaded();
      this.cdr.markForCheck();
    });

    this.subs.push(sub);
  }
  loadMdfFiles(period: string): void {
    const apiPeriod = this.mapPeriodToApi(period);
    const db = this.serverState.getSelectedDatabase();
    this.dashboardSvc
      .getTopFragmentedMdfFiles(apiPeriod, db || '')
      .pipe(
        catchError((err) => {
          console.error('MDF API err', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((mdfRes: any) => {
        if (mdfRes && mdfRes.success && Array.isArray(mdfRes.data)) {
          this.mdfFiles = mdfRes.data.map((m: any) => ({
            mdfFiles: m.mdfFiles,
            serverName: m.serverName,
            location: m.location,
            sizeInMB: m.sizeInMB,
            sizeFormatted: this.formatSize(m.sizeInMB),
            fragmentedPercent: m.fragmentedPercent,
            statusWithIndex: m.statusWithIndex,
          }));
        } else {
          this.mdfFiles = [];
        }

        this.cdr.markForCheck();
      });
  }

  // size formatter
  formatSize(sizeInMB: number) {
    if (sizeInMB >= 1024) {
      const gb = sizeInMB / 1024;
      return `${gb.toFixed(2)} GB`;
    }
    return `${sizeInMB.toLocaleString()} KB`;
  }

  getDiskColor(freePercent: number): string {
    if (freePercent > 50) return 'linear-gradient(to right, #22c55e, #4ade80)'; // green
    if (freePercent > 20) return 'linear-gradient(to right, #facc15, #fbbf24)'; // yellow
    return 'linear-gradient(to right, #ef4444, #f87171)'; // red
  }

  // Chart builders (kept same but ensure they don't call detectChanges themselves)
  buildFillFactorChart(rows: any[]) {
    const categories = rows.map((r) => r.day?.substr(0, 3).toUpperCase() || '');
    const fragmentationSeries = rows.map((r) => r.avg_Fragmentation ?? 0);
    const fillFactorSeries = rows.map((r) => r.fill_Factor ?? 0);

    this.fillFactorChartOptions = {
      series: [
        { name: 'Fragmentation', data: fragmentationSeries },
        { name: 'Fill Factor', data: fillFactorSeries },
      ],
      chart: {
        type: 'line',
        height: 300,
        zoom: { enabled: false },
        background: 'transparent',
      },
      stroke: { width: [3, 3], curve: 'smooth' },
      // colors left as-is per original, you may change them centrally
      colors: ['#00E396', '#008FFB'],
      markers: {
        size: 5,
        colors: ['#1E1E1E'],
        strokeColors: ['#00E396', '#008FFB'],
        strokeWidth: 3,
      },
      xaxis: {
        categories,
        labels: { style: { colors: '#ffffff' } },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: { style: { colors: '#ffffff' } },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: '#2d2d2d' },
      legend: {
        position: 'top',
        labels: { colors: '#ffffff' },
      },
      tooltip: { shared: true, theme: 'dark' },
    } as LineChartOptions;
  }

  buildTotalFragmentationChart(rows: any[]) {
    this.noFragmentation = rows.length === 0;

    // If no data, do not build the chart
    if (this.noFragmentation) {
      this.totalFragmentationChartOptions = undefined;

      return;
    }
    const categories = rows.map((r) => (r.day ? r.day.substr(0, 3).toUpperCase() : ''));
    const values = rows.map((r) => r.total_Fragmentation ?? 0);

    this.totalFragmentationChartOptions = {
      series: [
        {
          name: 'Total Fragmentation',
          data: values,
        },
      ],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: { show: false },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '80%',
          distributed: true,
        },
      },
      colors: ['#2196F3', '#10B981', '#FBBF24', '#F97316', '#8B5CF6', '#3B82F6', '#22C55E'],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#ffffff'],
          fontSize: '12px',
          fontWeight: 'bold',
        },
        formatter: (val: number) => `${val.toFixed(1)}%`,
        background: {
          enabled: false,
        },
      },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: '#fff',
            fontSize: '12px',
          },
          formatter: (val: number) => `${val}%`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#fff',
            fontSize: '12px',
            fontWeight: 500,
          },
        },
      },
      legend: {
        show: false,
        position: 'bottom',
        labels: { colors: '#fff' },
        markers: {
          width: 12,
          height: 12,
          radius: 4,
        },
      },
      grid: {
        borderColor: '#444',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`,
        },
      },
    } as unknown as BarChartOptions;
  }

  buildTotalIndexFragmentationChart(rows: any[]) {
    // API has executed
    this.isTotalIndexApiCalled = true;

    // No data case
    this.noFragmentationData = rows.length === 0;

    if (this.noFragmentationData) {
      this.totalIndexFragmentationChartOptions = undefined;
      return;
    }

    // Chart when data exists
    const categories = rows.map((r) => (r.day ? r.day.substr(0, 3).toUpperCase() : ''));
    const values = rows.map((r) => r.total_Fragmentation ?? 0);

    this.totalIndexFragmentationChartOptions = {
      series: [{ name: 'Total Index Fragmentation', data: values }],
      chart: { type: 'bar', height: 300, toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { horizontal: true, barHeight: '80%', distributed: true } },
      colors: ['#2196F3', '#10B981', '#FBBF24', '#F97316', '#8B5CF6', '#3B82F6', '#22C55E'],
      dataLabels: {
        enabled: true,
        style: { colors: ['#ffffff'], fontSize: '12px', fontWeight: 'bold' },
        formatter: (val: number) => `${val.toFixed(1)}%`,
        background: { enabled: false },
      },
      xaxis: {
        categories,
        labels: { style: { colors: '#fff', fontSize: '12px' }, formatter: (val: number) => `${val}%` },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: '#fff', fontSize: '12px', fontWeight: 500 } },
      },
      legend: { show: false },
      grid: {
        borderColor: '#444',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => `${val.toFixed(1)}%` },
      },
    } as any;
  }

  // DISK STORAGE loader
  loadDiskStorage(): void {
    const conn = this.serverState.getConnection();
    if (!conn) {
      // no connection, nothing to load
      return;
    }

    this.dashboardSvc
      .GetDiskStorage(conn.server, conn.username, conn.password)
      .pipe(
        catchError((err) => {
          console.error('Disk storage load failed', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.diskStorage = res.data;
        } else {
          this.diskStorage = [];
        }
        this.cdr.markForCheck();
      });
  }

  onAttachDatabase(item: any) {
    const databaseName = this.serverState.getSelectedDatabase();
    const mdfFilePath = item?.location;
    if (!databaseName || !mdfFilePath) {
      this.toaster.error('Please Select Database First to Execute.');
      return;
    }

    const payload: any = {
      databaseName: databaseName,
      mdfFilePath: mdfFilePath,
    };

    this.dashboardSvc
      .SafeAttachDatabase(payload)
      .pipe(
        catchError((err) => {
          console.error('SafeDetachDatabase failed:', err);
          this.toaster.error('Safe Detach operation failed.');
          return of(null);
        }),
        take(1),
      )
      .subscribe((res) => {
        if (res && res.success) {
          this.toaster.success('Database safely detached and ready to attach.');
        } else {
          this.toaster.error(res?.message || 'Unable to safely detach database.');
        }
      });
  }

  onDetachDatabase(item: any) {
    const databaseName = this.serverState.getSelectedDatabase();
    if (!databaseName) {
      this.toaster.error('Database name not found.');
      return;
    }

    const payload = {
      databaseName: databaseName,
    };

    this.dashboardSvc
      .SafeDetachDatabase(payload)
      .pipe(
        catchError((err) => {
          console.error('DetachDatabase failed:', err);
          this.toaster.error('Detach operation failed.');
          return of(null);
        }),
        take(1),
      )
      .subscribe((res) => {
        if (res && res.success) {
          this.toaster.success('Database detached successfully.');
        } else {
          this.toaster.error(res?.message || 'Unable to detach database.');
        }
      });
  }
  toggleRowMenu(row: any): void {
    // Close all other menus
    this.mdfFiles.forEach((r) => {
      if (r !== row) {
        r._showMenu = false;
        r._showTaskSubMenu = false;
      }
    });

    row._showMenu = !row._showMenu;

    // Close submenu when main menu toggles
    if (!row._showMenu) {
      row._showTaskSubMenu = false;
    }
  }

  toggleTaskSubMenu(row: any): void {
    row._showTaskSubMenu = !row._showTaskSubMenu;
  }

  GetServerHealthStatus(): void {
    this.dashboardSvc
      .GetServerHealthStatus()
      .pipe(
        catchError((err) => {
          console.error('MDF API err', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.ServerHealthStatus = res.data;
        } else {
          this.mdfFiles = [];
        }

        this.cdr.markForCheck();
      });
  }

  onTakeOffline(row: any) {
    this.isOffline = true;
    console.log('Taken offline:', row);
    this.closeMenu();
  }

  onBringOnline(row: any) {
    this.isOffline = false;
    console.log('Brought online:', row);
    this.closeMenu();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  openCloseConnectionsDialog(data: any, flag: boolean) {
    const dialogRef = this.dialog.open(TakeOfflineDialogComponent, {
      width: '650px',
      disableClose: true,
      data: data, // optional
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isOffline = flag;
      }
    });
  }
  openDetailedFragmentation(data: any) {
    const dialogRef = this.dialog.open(DefragmentTablesComponent, {
      width: '850px',
      disableClose: true,
      data: data, // optional
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.initCalls();
      }
    });
  }

  onIndexReorg(row: any) {
    console.log('Index Reorg clicked', row);
    // Call your API here
  }

  onReindex(row: any) {
    console.log('Reindex clicked', row);
    // Call your API here
  }
}
