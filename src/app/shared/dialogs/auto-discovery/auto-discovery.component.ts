import { Component, Inject, NgZone, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { SidebarService } from 'src/app/core/services/Sidebar/sidebar.service';
import { ServerComponent } from '../server/server.component';
import { concatMap, of, Subject, takeUntil } from 'rxjs';
import { ServerStateService } from 'src/app/core/services/server-state.service';

@Component({
  selector: 'app-auto-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  templateUrl: './auto-discovery.component.html',
})
export class AutoDiscoveryComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private serverState = inject(ServerStateService);
  private serverService = inject(ServerService);
  private sidebarService = inject(SidebarService);
  private toast = inject(ToasterService);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  private destroy$ = new Subject<void>();

  authUser: any;
  sqlServers: { name: string; selected: boolean }[] = [];
  serverDetails: any[] = [];
  selectAll = false;
  selectedCount = 0;
  isLoading = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<AutoDiscoveryComponent>) {}

  ngOnInit() {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.authUser = JSON.parse(authUser);

    this.zone.run(() => {
      this.fetchServerList();
      this.getServerConnectionByUser();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** ✅ Fetch the server list */
  fetchServerList() {
    this.isLoading = true;

    this.serverService
      .getUserServerList(this.authUser.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.zone.run(() => {
            this.isLoading = false;

            if (res?.success && Array.isArray(res.data)) {
              this.sqlServers = res.data.map((s: any) => ({
                name: s.serverName,
                selected: false,
              }));
              this.toast.success(`${this.sqlServers.length} server(s) found.`);
            } else {
              this.sqlServers = [];
              this.toast.warning('No servers found.');
            }

            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.zone.run(() => {
            this.isLoading = false;
            this.toast.error('Failed to fetch server list.');
            this.cdr.detectChanges();
          });
        },
      });
  }

  /** ✅ Fetch connection details */
  getServerConnectionByUser() {
    this.serverService
      .getServerConnectionByUser(this.authUser.userId, this.authUser.accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.zone.run(() => {
            this.serverDetails = res?.data || [];
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.toast.error('Failed to fetch server details.');
        },
      });
  }

  /** ✅ Select all servers */
  toggleAll() {
    this.sqlServers.forEach((s) => (s.selected = this.selectAll));
    this.updateSelectionCount();
  }

  /** ✅ Update selection counter */
  updateSelectionCount() {
    this.selectedCount = this.sqlServers.filter((s) => s.selected).length;
    this.selectAll = this.selectedCount === this.sqlServers.length;
  }

  /** ✅ Connect only once and let sidebar load databases */
  connect() {
    const selectedServers = this.sqlServers.filter((s) => s.selected);
    if (!selectedServers.length) {
      this.toast.warning('Please select at least one server.');
      return;
    }

    this.isLoading = true;
    const serverNames = selectedServers.map((s) => s.name).join(',');

    this.serverService
      .getServerConnectionByServerNam(serverNames)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res?.success || !res.data?.length) {
            this.toast.warning('No connection details found for selected servers.');
            this.isLoading = false;
            return;
          }

          // ✅ Save ONE connection (first one or choose logic)
          const first = res.data[0];

          this.serverState.setConnection({
            server: first.serverName,
            username: first.userName,
            password: first.passwordHash,
            connectionID: first.connectionID,
          });

          // ✅ SidebarMenuComponent will automatically fire ONE GetDatabases call
          this.toast.success('Servers connected successfully.');
          this.dialogRef.close();
        },
        error: (err) => {
          console.error('Connection error:', err);
          this.toast.error('Error during connection.');
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  /** ✅ Close and open server dialog */
  closeDialog() {
    this.dialogRef.close();
    const dialogRef = this.dialog.open(ServerComponent, { disableClose: true });
    dialogRef.afterClosed().subscribe(() => {});
  }
}
