import { Component, inject, Inject, NgZone, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, switchMap, take, takeUntil, Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { SidebarService } from 'src/app/core/services/Sidebar/sidebar.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-server',
  imports: [FormsModule, ReactiveFormsModule, AngularSvgIconModule, CommonModule],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
})
export class ServerComponent implements OnInit, OnDestroy {
  serverForm!: FormGroup;
  submitted = false;
  userData: any;
  recentConnections: any[] = [];
  selectedConnection: any = null;
  activeTab: 'history' = 'history';
  activePropertiesTab: 'properties' | 'connectionString' = 'properties';
  databases: string[] = [];
  isLoadingDatabases = false;
  isConnecting = false;

  private dialog = inject(MatDialog);
  private encryptionService = inject(EncryptionService);
  private toast = inject(ToasterService);
  private serverService = inject(ServerService);
  private sidebarService = inject(SidebarService);
  private serverState = inject(ServerStateService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  innerConnectionId: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ServerComponent>,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    const encryptData = localStorage.getItem('authObj');
    if (encryptData) this.userData = JSON.parse(encryptData);
    this.initForm();
    this.loadRecentConnections();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.serverForm = new FormGroup({
      serverType: new FormControl('MS SQL Server', Validators.required),
      serverName: new FormControl('', Validators.required),
      authenticationType: new FormControl('SQLSA', Validators.required),
      username: new FormControl(''),
      password: new FormControl(''),
      rememberPassword: new FormControl(true),
      databaseName: new FormControl(''),
      encrypt: new FormControl('Mandatory'),
      trustServerCertificate: new FormControl(true),
    });

    // Update validators based on authentication type
    this.serverForm.get('authenticationType')?.valueChanges.subscribe((authType) => {
      const usernameControl = this.serverForm.get('username');
      const passwordControl = this.serverForm.get('password');
      
      if (authType === 'WA') {
        usernameControl?.clearValidators();
        passwordControl?.clearValidators();
      } else {
        usernameControl?.setValidators(Validators.required);
        passwordControl?.setValidators(Validators.required);
      }
      
      usernameControl?.updateValueAndValidity();
      passwordControl?.updateValueAndValidity();
    });
  }

  loadRecentConnections() {
    if (!this.userData?.userId) {
      return;
    }
    const accountId = this.userData?.accountId || this.userData?.companyId || '';

    if (!accountId) {
      console.warn('AccountId not found in user data');
      return;
    }

    this.serverService
      .getServerConnectionByUser(this.userData.userId, accountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.ngZone.run(() => {
            this.recentConnections = res?.data || [];
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.recentConnections = [];
            console.error('Error loading connections:', err);
            this.toast.error('Failed to load recent connections.');
            this.cdr.detectChanges();
          });
        },
      });
  }

  selectConnection(connection: any) {
    this.selectedConnection = connection;
    const authType = connection.authenticationType || 'SQLSA';
    
    this.serverForm.patchValue({
      serverName: connection.serverName || '',
      authenticationType: authType,
      username: connection.userName || '',
      password: connection.passwordHash || '',
      rememberPassword: true,
      databaseName: connection.databaseName || '',
    });

    // Update validators based on auth type
    const usernameControl = this.serverForm.get('username');
    const passwordControl = this.serverForm.get('password');
    
    if (authType === 'WA') {
      usernameControl?.clearValidators();
      passwordControl?.clearValidators();
    } else {
      usernameControl?.setValidators(Validators.required);
      passwordControl?.setValidators(Validators.required);
    }
    
    usernameControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();

    this.cdr.detectChanges();
  }

  deleteConnection(connection: any, event: Event) {
    event.stopPropagation(); // Prevent selecting the connection when clicking delete
    
    if (!this.userData?.userId || !connection.connectionID) {
      this.toast.error('Unable to delete connection.');
      return;
    }

    // Open confirmation modal
    const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      data: {
        title: 'DELETE CONNECTION',
        message: 'Are you sure you want to delete this connection?',
        cancelText: 'No',
        submitText: 'Yes',
      },
    });

    confirmDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User confirmed deletion
        this.serverService
          .deleteUserServerList(this.userData.userId, connection.connectionID)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => {
              this.ngZone.run(() => {
                if (res?.success || res?.statusCode === 200 || res?.data?.success) {
                  this.toast.success(res?.message || res?.data?.message || 'Connection deleted successfully');
                  
                  // Remove from recent connections list
                  this.recentConnections = this.recentConnections.filter(
                    (conn) => conn.connectionID !== connection.connectionID
                  );
                  
                  // Clear selection if deleted connection was selected
                  if (this.selectedConnection?.connectionID === connection.connectionID) {
                    this.selectedConnection = null;
                    this.resetForm();
                  }
                  
                  this.cdr.detectChanges();
                } else {
                  this.toast.error(res?.message || res?.data?.message || 'Failed to delete connection.');
                }
              });
            },
            error: (err) => {
              this.ngZone.run(() => {
                this.toast.error(err?.error?.message || 'Failed to delete connection.');
              });
            },
          });
      }
    });
  }


  onFormChange() {
    // Load databases when server credentials are entered
    const serverName = this.serverForm.get('serverName')?.value;
    const username = this.serverForm.get('username')?.value;
    const password = this.serverForm.get('password')?.value;
    
  }

  get f() {
    return this.serverForm.controls;
  }

  getConnectionDisplayName(connection: any): string {
    const server = connection.serverName || '';
    const database = connection.databaseName || '<default>';
    const user = connection.userName || '';
    return `${server}, ${database} (${user})`;
  }

  resetForm() {
    this.selectedConnection = null;
    this.serverForm.reset({
      serverType: 'MS SQL Server',
      serverName: '',
      authenticationType: 'SQLSA',
      username: '',
      password: '',
      rememberPassword: true,
      databaseName: '',
      encrypt: 'Mandatory',
      trustServerCertificate: true,
    });
  }

  /** 🔹 Connect & Load Databases */
  onSubmit() {
    this.submitted = true;
    if (this.serverForm.invalid) return;

    this.isConnecting = true;
    this.cdr.detectChanges();

    const { serverType, serverName, authenticationType, username, password, rememberPassword } = this.serverForm.value;

    const payload = {
      userId: this.userData.userId,
      serverType,
      isAutoDiscovery: false,
      serverName,
      authenticationType,
      username,
      password,
      rememberPassword,
    };

    this.serverService
      .connectServerConnection(payload)
      .pipe(
        take(1),
        catchError(() => {
          this.isConnecting = false;
          this.cdr.detectChanges();
          this.toast.error('Server connection failed');
          return EMPTY;
        }),
        /** 🔁 On success, immediately call GetDatabases */
        switchMap((res): any => {
          if (res && res.statusCode && [200, 201].includes(res.statusCode)) {
            this.toast.success(res.message || 'Server connected successfully');
            this.innerConnectionId = res.data.connectionID;
            const connection = {
              server: serverName,
              username,
              password,
              serverType,
              innerConnectionID: this.innerConnectionId,
            };
            this.serverState.setConnection(connection);
            this.isConnecting = false;
            this.cdr.detectChanges();
            this.closeDialog();
          } else {
            this.isConnecting = false;
            this.cdr.detectChanges();
            this.toast.error(res.message || 'Failed to connect server');
            return EMPTY;
          }
        }),
      )
      .subscribe({
        next: (dbRes: any) => {
        try {
          const dbs = dbRes?.data?.databases || [];
          if (dbs.length) {
            this.toast.success(`${dbs.length} databases found.`);
          } else {
            this.toast.warning('Connected but no databases found.');
          }
          this.dialogRef.close();
        } catch (error) {
          console.error('Error handling database response:', error);
            this.isConnecting = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.isConnecting = false;
          this.cdr.detectChanges();
        },
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
