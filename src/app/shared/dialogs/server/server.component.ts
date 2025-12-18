import { Component, inject, Inject, NgZone } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, switchMap, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { SidebarService } from 'src/app/core/services/Sidebar/sidebar.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AuthResponse } from 'src/app/core/models/auth.model';
import { EncryptionService } from 'src/app/core/services/encryption/encryption.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { AutoDiscoveryComponent } from '../auto-discovery/auto-discovery.component';

@Component({
  selector: 'app-server',
  imports: [FormsModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './server.component.html',
  styleUrl: './server.component.css',
})
export class ServerComponent {
  serverForm!: FormGroup;
  submitted = false;
  userData!: AuthResponse;

  private dialog = inject(MatDialog);
  private encryptionService = inject(EncryptionService);
  private toast = inject(ToasterService);
  private serverService = inject(ServerService);
  private sidebarService = inject(SidebarService);
  private serverState = inject(ServerStateService);
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
  }

  initForm() {
    this.serverForm = new FormGroup({
      serverType: new FormControl('MS SQL Server', Validators.required),
      serverName: new FormControl('', Validators.required),
      authenticationType: new FormControl('', Validators.required),
      username: new FormControl('', Validators.required),
      autodiscover: new FormControl(false),
      password: new FormControl('', Validators.required),
      rememberPassword: new FormControl(false),
    });
  }

  get f() {
    return this.serverForm.controls;
  }

  /** 🔹 Connect & Load Databases */
  onSubmit() {
    this.submitted = true;
    if (this.serverForm.invalid) return;

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
            this.closeDialog();
          } else {
            this.toast.error(res.message || 'Failed to connect server');
            return EMPTY;
          }
        }),
      )
      .subscribe((dbRes: any) => {
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
        }
      });
  }

  onConnect(): void {
    const dialogRef = this.dialog.open(AutoDiscoveryComponent, {
      disableClose: true,
    });
    this.dialogRef.close();
    dialogRef.afterClosed().subscribe(() => {});
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
