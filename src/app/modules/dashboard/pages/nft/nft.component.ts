import { Component, inject, OnDestroy, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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
import { ConfirmationComponent } from 'src/app/shared/dialogs/confirmation/confirmation.component';
import { Overlay } from '@angular/cdk/overlay';
import { TakeOfflineDialogComponent } from './take-offline-dialog/take-offline-dialog.component';
import { DefragmentTablesComponent } from './defragment-tables/defragment-tables.component';
import { LoaderComponent } from 'src/app/shared/dialogs/loader/loader.component';
import { IndexAnalysisDialogComponent } from './index-analysis-dialog/index-analysis-dialog.component';
import { ReorganizeResultDialogComponent } from './reorganize-result-dialog/reorganize-result-dialog.component';
import { RebuildResultDialogComponent } from './rebuild-result-dialog/rebuild-result-dialog.component';
import { IndexSettingsComponent } from 'src/app/shared/dialogs/index-settings/index-settings.component';
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
  imports: [CommonModule, FormsModule, NgApexchartsModule, DynamicBreadcrumbComponent, AngularSvgIconModule, LoaderComponent],
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
  openMdfMenuIndex: number | null = null;
  openMdfSubMenu: string | null = null;
  mdfMenuPosition: { x: number; y: number } | null = null;
  indexMenuPosition: { x: number; y: number } | null = null;
  activityModuleName: any;
  noFragmentation: any;
  ServerHealthStatus: any;
  // flags for loading
  isLoadingBackup = false;
  isLoadingDefragment = false;

  constructor(private dashboardSvc: ServerService, public serverState: ServerStateService, private overlay: Overlay) {}

  ngOnInit(): void {
    const forgeryToken = localStorage.getItem('forgeryToken');
    if (!forgeryToken) {
      this.getForgeryToken();
    } else {
      this.initCalls();
    }
  }
  // ================= INDEX STATISTICS =================
  /**
   * Rebuild Index
   * @param row - Index row data from indexFilesReviews
   */
  rebuildIndex(row: any) {
    if (!row) {
      this.toaster.error('Invalid index data');
      return;
    }

    const databaseName = this.serverState.getSelectedDatabase();
    if (!databaseName) {
      this.toaster.error('Please select a database first');
      return;
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      width: '90%',
      maxWidth: '500px',
      panelClass: 'warning-dialog',
      data: {
        title: 'Rebuild Index',
        message: `Are you sure you want to rebuild index "${row.index}" on table "${row.table}"? This operation may take some time and will lock the table.`,
        cancelText: 'Cancel',
        submitText: 'Rebuild',
        isWarning: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      // Show loading indicator
      this.isLoadingDefragment = true;

      // Prepare rebuild request
      const rebuildPayload = {
        databaseName: databaseName,
        tableName: row.table || undefined,
        indexName: row.index || undefined,
        fillFactor: row.fillFactor || 80,
        sortOrder: 'ASC',
        maxDOP: undefined,
        onlineRebuild: false,
        updateStats: true,
        recompileProcs: false,
        fragmentationThreshold: 30,
      };

      // Call rebuild API
      this.dashboardSvc.rebuildIndexes(rebuildPayload).subscribe({
        next: (response: any) => {
          this.isLoadingDefragment = false;

          if (response && response.statusCode === 200 && response.success) {
            const summary = response.data?.operationSummary;
            const details = response.data?.indexDetails || [];

            if (summary?.resultType === 'ERROR' || summary?.ResultType === 'ERROR') {
              // Show error in dialog
              this.dialog.open(RebuildResultDialogComponent, {
                disableClose: false,
                width: '95vw',
                maxWidth: '1000px',
                height: '85vh',
                maxHeight: '700px',
                panelClass: 'custom-dark-dialog',
                data: {
                  summary: summary,
                  indexDetails: details,
                },
              });
              this.toaster.error(summary?.errorMessage || summary?.ErrorMessage || 'Index rebuild failed');
              return;
            }

            // Show success toast
            this.toaster.success('Index rebuild completed successfully.');

            // Open dialog with results
            this.dialog.open(RebuildResultDialogComponent, {
              disableClose: false,
              width: '95vw',
              maxWidth: '1000px',
              height: '85vh',
              maxHeight: '700px',
              panelClass: 'custom-dark-dialog',
              data: {
                summary: summary,
                indexDetails: details,
              },
            });

            // Refresh only the INDEX STATISTICS table (not the whole page)
            this.refreshIndexStatisticsOnly(databaseName);
          } else {
            this.toaster.error(response?.message || 'Index rebuild failed');
          }
        },
        error: (err) => {
          this.isLoadingDefragment = false;
          console.error('Rebuild index error', err);
          this.toaster.error(err?.error?.message || 'Failed to rebuild index');
        },
      });
    });
  }
  /**
   * Reindex Index (Reorganize)
   * @param row - Index row data from indexFilesReviews
   */
  reindexIndex(row: any) {
    if (!row) {
      this.toaster.error('Invalid index data');
      return;
    }

    const databaseName = this.serverState.getSelectedDatabase();
    if (!databaseName) {
      this.toaster.error('Please select a database first');
      return;
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      width: '90%',
      maxWidth: '500px',
      panelClass: 'warning-dialog',
      data: {
        title: 'Reorganize Index',
        message: `Are you sure you want to reorganize index "${row.index}" on table "${row.table}"? This operation is less intensive than rebuild and can be done online.`,
        cancelText: 'Cancel',
        submitText: 'Reorganize',
        isWarning: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      // Show loading indicator
      this.isLoadingDefragment = true;

      // Prepare reorganize request
      const reorganizePayload = {
        databaseName: databaseName,
        tableName: row.table || undefined,
        indexName: row.index || undefined,
        fragmentationThreshold: 10, // Default threshold for reorganize (lower than rebuild)
      };

      // Call reorganize API
      this.dashboardSvc.reorganizeIndexes(reorganizePayload).subscribe({
        next: (response: any) => {
          this.isLoadingDefragment = false;

          if (response && response.statusCode === 200 && response.success) {
            const summary = response.data?.operationSummary;
            const details = response.data?.indexDetails || [];

            if (summary?.resultType === 'ERROR' || summary?.ResultType === 'ERROR') {
              // Show error in dialog
              this.dialog.open(ReorganizeResultDialogComponent, {
                disableClose: false,
                width: '95vw',
                maxWidth: '1000px',
                height: '85vh',
                maxHeight: '700px',
                panelClass: 'custom-dark-dialog',
                data: {
                  summary: summary,
                  indexDetails: details,
                },
              });
              this.toaster.error(summary?.errorMessage || summary?.ErrorMessage || 'Index reorganization failed');
              return;
            }

            // Show success toast
            this.toaster.success('Index reorganization completed successfully.');

            // Open dialog with results
            this.dialog.open(ReorganizeResultDialogComponent, {
              disableClose: false,
              width: '95vw',
              maxWidth: '1000px',
              height: '85vh',
              maxHeight: '700px',
              panelClass: 'custom-dark-dialog',
              data: {
                summary: summary,
                indexDetails: details,
              },
            });

            // Refresh only the INDEX STATISTICS table (not the whole page)
            this.refreshIndexStatisticsOnly(databaseName);
          } else {
            this.toaster.error(response?.message || 'Index reorganization failed');
          }
        },
        error: (err) => {
          this.isLoadingDefragment = false;
          console.error('Reorganize index error', err);
          this.toaster.error(err?.error?.message || 'Failed to reorganize index');
        },
      });
    });
  }
  /**
   * Run Analyze
   * @param row 
   */
  runAnalyze(row: any) {
    const databaseName = this.serverState.getSelectedDatabase();
    if (!databaseName) {
      this.toaster.error('Please select a database first');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      width: '90%',
      maxWidth: '500px',
      panelClass: 'warning-dialog',
      data: {
        title: 'Confirm Index Analysis',
        message: `Are you sure you want to run analysis for index "${row.index}" on table "${row.table}" in database "${databaseName}"? This will analyze fragmentation and provide recommendations.`,
        cancelText: 'Cancel',
        submitText: 'Run Analysis',
        isWarning: false,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.dashboardLoading = true;
      const payload = {
        databaseName: databaseName,
        tableName: row.table,
        indexName: row.index,
        generateReport: true,
      };

      this.dashboardLoading = true;
      this.dashboardSvc
        .analyzeIndex(payload)
        .pipe(
          catchError((err) => {
            this.dashboardLoading = false;
            console.error('Analyze Index API error', err);
            this.toaster.error(err?.error?.message || 'Failed to run index analysis');
            return EMPTY;
          }),
          take(1),
        )
        .subscribe((res: any) => {
          this.dashboardLoading = false;
          if (res.success) {
            const summary = res.data?.summary;
            const details = res.data?.indexDetails || [];
            const recommendations = res.data?.recommendations;

            // Show success toast
            this.toaster.success('Index analysis completed successfully.');

            // Open dialog with analysis results
            this.dialog.open(IndexAnalysisDialogComponent, {
              disableClose: false,
              width: '95vw',
              maxWidth: '1200px',
              height: '90vh',
              maxHeight: '800px',
              panelClass: 'custom-dark-dialog',
              data: {
                summary: summary,
                indexDetails: details,
                recommendations: recommendations,
              },
            });
          } else {
            this.toaster.error(res.message || 'Failed to run index analysis');
          }
        });
    });
  }
  /**
   * Refresh only the INDEX STATISTICS table without refreshing the whole page
   * @param databaseName 
   */
  refreshIndexStatisticsOnly(databaseName: string): void {
    const indexName = this.serverState.getSelectedIndexName();
    const tableName = this.serverState.getSelectedTableName() || '';
    const apiPeriod = this.selectedPeriod;

    this.dashboardSvc
      .GetIndexFilesReview(databaseName, tableName, indexName || '', apiPeriod)
      .pipe(
        catchError((err) => {
          console.error('Error refreshing index statistics', err);
          return of(null);
        }),
        take(1),
      )
      .subscribe((res: any) => {
        if (res && res.success && Array.isArray(res.data)) {
          this.indexFilesReviews = res.data.map((m: any) => ({
            table: m.table,
            index: m.index,
            indexType: m.indexType,
            cluster: m.cluster,
            sortedPercent: m.sorted,
            columnsIndexed: m.columnsIndexed,
            sizeKB: m.size,
            rows: Number(m.rows),
            pages: Number(m.pages),
            fragmentationPercent: Number(m.fragmentation),
            fillFactor: Number(m.fillFactor),
            defragmentationStatus: m.defragmentationStatus,
          }));
          this.cdr.markForCheck();
        } else {
          if (!indexName) {
            this.indexFilesReviews = [];
          }
        }
      });
  }

  // ================= END INDEX STATISTICS =================
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
  analyzeMdfFile(row: any) {
    this.openDetailedFragmentation(row);
  }
  backupMdfFile(row: any): void {
    // ✅ Safety check
    if (!row?.mdfFiles) {
      console.warn('No selected database found.');
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
            this.isLoadingBackup = true;
            // ✅ STEP 3: Prepare Payload
            const defragPayload = {
              databaseName: row.mdfFiles,
              mdfFilePath: row.location,
              backupPath: backupPath,
            };

            // ✅ STEP 4: Call API
            return this.dashboardSvc.BackupDatabase(defragPayload);
          }),
        )
        .subscribe({
          next: (backupRes: any) => {
            console.log(backupRes);
            this.isLoadingBackup = false;
            if(!backupRes.data.success) {
              console.warn('No selected database found.');
              this.toaster.error(backupRes.data.message);
              return;
            }
            else {
              const viewData = {
                viewType: 1,
                databaseName: row.mdfFiles,
                backupFileName: backupRes.data.backupFileName,
                backupFullPath: backupRes.data.backupPath,
                status: backupRes.data.success,
                mdfFileName: row.location
              }
              this.dialog.open(DialogbackupListComponent, {
                height: '400px',
                data: viewData,
                panelClass: 'custom-dark-dialog',
              }); 
            }
          },
          error: (err) => {
            console.error('Defragment flow failed', err);
            this.isLoadingBackup = false;
          },
        });
    // });
  }

  defragmentMdfFile(row: any): void {
    // ✅ Safety check
    if (!row?.mdfFiles) {
      console.warn('No selected database found.');
      this.toaster.error('No database selected for defragmentation.');
      return;
    }

    // ✅ STEP 1: Show Backup Confirmation Dialog
    const confirmDialogRef = this.dialog.open(BackupConfirmationComponent, {
      disableClose: true,
      width: '500px',
      data: {},
    });

    confirmDialogRef.afterClosed().subscribe((backupConfirmed: boolean) => {
      if (backupConfirmed === true) {
        // ✅ User selected YES - Open Backup Dialog
        this.openBackupDialogForDefragmentation(row);
      } else if (backupConfirmed === false || backupConfirmed === undefined) {
        // ✅ User selected NO or closed dialog - Show warning and proceed
        this.showBackupWarningAndProceed(row);
      }
    });
  }

  private openBackupDialogForDefragmentation(row: any): void {
    // ✅ Open Backup Path Dialog (same as right-click on database, select TASK)
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

          // ✅ Prepare Defragmentation Payload
          const linkedServerName = this.serverState.getLinkedServerName();
          const defragPayload = {
            databaseName: row.mdfFiles,
            mdfFilePath: row.location,
            backupPath: backupPath,
            statusWithIndex: row.statusWithIndex,
            linkedServerName: linkedServerName,
          };
          this.isLoadingBackup = true;
          // ✅ Call DefragmentMDF API
          return this.dashboardSvc.DefragmentMDF(defragPayload);
        }),
      )
      .subscribe({
        next: (defragRes: any) => {
          const logId = defragRes?.data?.logId || defragRes?.logId || null;

          if (!logId) {
            console.warn('DefragmentMDF did not return logId.');
            this.toaster.error('Defragmentation failed. No log ID returned.');
            return;
          }
          this.isLoadingBackup = false;
          // ✅ Show success message and open Backup Log Dialog
          this.toaster.success('Defragmentation started successfully.');
          this.dialog.open(DialogbackupListComponent, {
            height: '400px',
            data: { 
              logId: logId,
              viewType: 2
             },
            panelClass: 'custom-dark-dialog',
          });
        },
        error: (err) => {
          console.error('Defragment flow failed', err);
          this.toaster.error(err?.error?.message || 'Failed to start defragmentation.');
        },
      });
  }

  private showBackupWarningAndProceed(row: any): void {
    // ✅ Show warning modal
    const warningDialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      width: '90%',
      maxWidth: '500px',
      panelClass: 'warning-dialog',
      data: {
        title: 'Warning',
        message: 'It is recommended that the Database be backed up before defragmentation.',
        cancelText: 'Cancel',
        submitText: 'Proceed',
        isWarning: true, // Flag to show warning style
      },
    });

    warningDialogRef.afterClosed().subscribe((proceed: boolean) => {
      if (proceed) {
        // ✅ User clicked "Proceed" - Open backup dialog
        this.proceedWithDefragmentationWithoutBackup(row);
      }

    });
  }

  private proceedWithDefragmentationWithoutBackup(row: any): void {
    // ✅ Prepare Defragmentation Payload without backup path
    // Note: backupPath might be optional or we pass empty string
    const linkedServerName = this.serverState.getLinkedServerName();
    const defragPayload = {
      databaseName: row.mdfFiles,
      mdfFilePath: row.location,
      backupPath: '', // Empty backup path when user chooses not to backup
      statusWithIndex: row.statusWithIndex,
      linkedServerName: linkedServerName,
    };
    this.isLoadingDefragment = true;
    // ✅ Call DefragmentMDF API
    this.dashboardSvc.DefragmentMDF(defragPayload).subscribe({
      next: (defragRes: any) => {
        const logId = defragRes?.data?.logId || defragRes?.logId || null;
        this.isLoadingDefragment = false;
        if (!logId) {
          console.warn('DefragmentMDF did not return logId.');
          this.toaster.error('Defragmentation failed. No log ID returned.');
          return;
        }

        // ✅ Show success message and open Backup Log Dialog
        this.toaster.success('Defragmentation started successfully.');
        this.dialog.open(DialogbackupListComponent, {
          height: '400px',
          data: { logId },
          panelClass: 'custom-dark-dialog',
        });
      },
      error: (err) => {
        console.error('Defragment flow failed', err);
        this.toaster.error(err?.error?.message || 'Failed to start defragmentation.');
      },
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

  toggleMenu(i: number, event?: MouseEvent) {
    if (this.openMenuIndex === i) {
      this.openMenuIndex = null;
      this.openSubMenu = null;
      this.indexMenuPosition = null;
      this.menu.row = null;
      return;
    }
    
    this.openMenuIndex = i;
    this.openSubMenu = null;
    
    // Set the row data from indexFilesReviews
    if (this.indexFilesReviews && this.indexFilesReviews[i]) {
      this.menu.row = this.indexFilesReviews[i];
    }
    
    if (event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      
      this.indexMenuPosition = {
        x: rect.left,
        y: rect.bottom + 4
      };
    }
  }

  toggleMdfMenu(index: number, row: any, event?: MouseEvent) {
    if (this.openMdfMenuIndex === index) {
      this.closeMdfMenu();
      return;
    }
    
    this.openMdfMenuIndex = index;
    this.openMdfSubMenu = null;
    this.menu.row = row;
    
    if (event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      
      this.mdfMenuPosition = {
        x: rect.left,
        y: rect.bottom + 4
      };
    }
  }

  closeMdfMenu() {
    this.openMdfMenuIndex = null;
    this.openMdfSubMenu = null;
    this.menu.row = null;
    this.mdfMenuPosition = null;
  }

  toggleSubMenu(menu: string) {
    this.openSubMenu = this.openSubMenu === menu ? null : menu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Check if click is on menu button - don't close if so
    const isButtonClick = target.closest('.role-menu-button') !== null;
    if (isButtonClick) {
      return;
    }
    
    // Check if click is inside a fixed menu
    let element: HTMLElement | null = target;
    let isMenuClick = false;
    while (element && element !== document.body) {
      const classList = element.classList;
      if (classList.contains('fixed') && classList.contains('z-[99999]')) {
        isMenuClick = true;
        break;
      }
      element = element.parentElement;
    }
    
    // Don't close if clicking on menu
    if (isMenuClick) {
      return;
    }
    
    // Close MDF menu if clicking outside
    if (this.openMdfMenuIndex !== null) {
      this.closeMdfMenu();
    }
    
    // Close Index Statistics menu if clicking outside
    if (this.openMenuIndex !== null) {
      this.openMenuIndex = null;
      this.openSubMenu = null;
      this.indexMenuPosition = null;
    }
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
            databaseName: m.databaseName,
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

    const linkedServerName = this.serverState.getLinkedServerName();

    const payload: any = {
      databaseName: databaseName,
      mdfFilePath: mdfFilePath,
      linkedServerName: linkedServerName,
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

    const linkedServerName = this.serverState.getLinkedServerName();

    const payload = {
      databaseName: databaseName,
      linkedServerName: linkedServerName,
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

  openIndexSettings() {
    const dialogRef = this.dialog.open(IndexSettingsComponent, {
      width: 'auto',
      maxWidth: '1500px',
      height: 'auto',
      maxHeight: '95vh',
      disableClose: true,
      data: null, // You can pass existing settings here if needed
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'responsive-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle the settings result here
        console.log('Settings saved:', result);
        // You can save the settings or apply them as needed
      }
    });
  }
}
