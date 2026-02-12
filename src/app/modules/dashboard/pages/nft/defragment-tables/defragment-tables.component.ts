import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ServerService } from 'src/app/core/services/server/server.service';
import { ServerStateService } from 'src/app/core/services/server-state.service';
import { ToasterService } from 'src/app/core/services/toaster/toaster.service';
import { catchError, EMPTY, take } from 'rxjs';

@Component({
  selector: 'app-defragment-tables',
  imports: [CommonModule],
  templateUrl: './defragment-tables.component.html',
  styleUrl: './defragment-tables.component.css',
})
export class DefragmentTablesComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<DefragmentTablesComponent>);
  private cdr = inject(ChangeDetectorRef);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private _serverService = inject(ServerService);
  private _serverState = inject(ServerStateService);
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
    const linkedServerName = this._serverState.getLinkedServerName();
    this._serverService
      .getDetailedTableFragmentation(this.data.databaseName, 5, linkedServerName)
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

  /**
   * Format date as mm-dd-ccyy hh:mm AM|PM
   * @param date - Date string or Date object
   * @returns Formatted date string
   */
  formatAnalysisTime(date: any): string {
    if (!date) {
      return '';
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }

    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hourFormatted = String(hour12).padStart(2, '0');

    return `${month}-${day}-${year} ${hourFormatted}:${minutes} ${ampm}`;
  }
}
