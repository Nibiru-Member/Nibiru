import { Component, inject, Inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, EMPTY, take } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { ServerService } from 'src/app/core/services/server/server.service';
import { AngularSvgIconModule } from 'angular-svg-icon';

@Component({
  selector: 'app-discovery',
  imports: [FormsModule, ReactiveFormsModule, AngularSvgIconModule],
  templateUrl: './discovery.component.html',
  styleUrl: './discovery.component.css',
})
export class DiscoveryComponent {
  serverForm!: FormGroup;
  submitted: boolean = false;
  servers = [
    'SQL Server 2017',
    'SQL Server 2016',
    'SQL Server 2015',
    'SQL Server 2014',
    'SQL Server 2013',
    'SQL Server 2012',
    'SQL Server 2011',
  ];

  private toast = inject(ToasterService);
  private serverService = inject(ServerService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DiscoveryComponent>) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    // ✅ Create form with FormControls for each server
    this.serverForm = new FormGroup({
      servers: new FormArray(this.servers.map(() => new FormControl(false))),
    });
  }

  // ✅ Easy getter for FormArray
  get serverArray(): FormArray<FormControl<boolean>> {
    return this.serverForm.get('servers') as FormArray<FormControl<boolean>>;
  }

  // ✅ Count of selected servers
  get selectedCount(): number {
    return this.serverArray.value.filter((v: boolean) => v).length;
  }

  // ✅ Check if all are selected
  get isAllSelected(): boolean {
    return this.selectedCount === this.servers.length;
  }

  // ✅ Select / Deselect all
  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.serverArray.controls.forEach((control) => control.setValue(checked));
  }

  // ✅ Form submit
  onSubmit() {
    const selectedServers = this.servers.filter((_, i) => this.serverArray.value[i]);
    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
