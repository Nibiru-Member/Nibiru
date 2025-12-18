import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http/http.service';
import { BaseResponse } from '../models/common.model';
import { ActivityPayload } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActiveHistoryService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  /**
   * Used to Add Roles
   * @param data
   * @returns
   */
  AddActivityHistory(data: ActivityPayload): Observable<BaseResponse> {
    return this.httpService.post(`/api/ActivityHistory/AddActivityHistory`, data, this.options);
  }
  /**
   * Used to get Roles by Id.
   * @param id
   * @returns
   */
  GetActivityHistoryList(): Observable<BaseResponse> {
    return this.httpService.get(`/api/ActivityHistory/GetActivityHistoryList`, this.options);
  }
}
