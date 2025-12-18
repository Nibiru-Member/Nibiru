import { Injectable } from '@angular/core';
import { take } from 'rxjs';
import { ActiveHistoryService } from '../active-history.service';
import { ActivityPayload } from '../../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityLoggerService {
  private userData: any;

  constructor(private activityService: ActiveHistoryService) {
    const authUser = localStorage.getItem('authObj');
    if (authUser) this.userData = JSON.parse(authUser);
  }

  /**
   * Core Logger - All logging goes through this
   */
  private log(
    moduleName: string,
    actionName: 'UPDATE' | 'DELETE' | string,
    description: string,
    status: 'S' | 'F', // Success or Fail
    relatedToId: string,
  ): void {
    const payload: ActivityPayload = {
      activityModuleName: moduleName,
      activityActionName: actionName,
      activityDescription: description,
      activityStatus: actionName === 'DELETE' ? 'D' : status, // delete always "D"
      activityById: this.userData?.userId || '',
      activityByName: this.userData?.userName || '',
      activityRelatedTo: moduleName || '',
      accountId: this.userData?.accountId || '',
      relatedToId: relatedToId,
    };

    this.activityService.AddActivityHistory(payload).pipe(take(1)).subscribe();
  }

  /**
   * DELETE Logging
   */
  logDelete(moduleName: string, itemName: string, itemId: string, isSuccess: boolean) {
    const message = isSuccess ? `${moduleName} deleted successfully.` : `${moduleName} delete failed.`;

    this.log(moduleName, 'DELETE', message, isSuccess ? 'S' : 'F', itemId);
  }

  /**
   * UPDATE Logging
   */
  logUpdate(moduleName: string, message: string, id: string, isSuccess: boolean) {
    const description = isSuccess ? message : `Update failed: ${message}`;
    this.log(moduleName, 'UPDATE', description, isSuccess ? 'S' : 'F', id);
  }
}
