import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';

@Component({
  selector: 'app-defragment-tables',
  imports: [CommonModule],
  templateUrl: './defragment-tables.component.html',
  styleUrl: './defragment-tables.component.css',
})
export class DefragmentTablesComponent {
  private dialogRef = inject(MatDialogRef<DefragmentTablesComponent>);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private _serverService = inject(ServerService);
  private _toast = inject(ToasterService);
  private dialog = inject(MatDialog);
  uiDropAll = false;
  tableData: any[] = [];
  summaryData!: any;

  ngOnInit() {
    console.log(this.data);

    if (this.data) {
      this.getDetailedTableFragmentation();
    }
  }

  close() {
    this.dialogRef.close();
  }

  confirm() {
    this.dialogRef.close(true);
  }

  getDetailedTableFragmentation() {
    this._serverService
      .getDetailedTableFragmentation(this.data.mdfFiles, 5)
      .pipe(
        catchError(() => EMPTY),
        take(1),
      )
      .subscribe((res: any) => {
        if (res.statusCode < 400) {
          console.log(res);
          this.tableData = res.data.fragmentationDetails;
          this.summaryData = res.data.summary;
          this.cdr.detectChanges();
        } else {
          this._toast.error(res.message);
        }
      });
  }
}
