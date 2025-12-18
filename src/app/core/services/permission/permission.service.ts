import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { Observable } from 'rxjs';
import { PermissionRecord } from '../../models/permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  /**
   * Used to add the Permission.
   * @param data
   * @returns
   */
  addPermissionRecord(data: PermissionRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/PermissionMaster/AddPermissionRecord`, data, this.options);
  }

  /**
   * Used to update the Permission.
   * @param data
   * @returns
   */
  updatePermissionRecord(data: PermissionRecord): Observable<BaseResponse> {
    return this.httpService.put(`/api/PermissionMaster/UpdatePermissionRecord`, data, this.options);
  }

  /**
   * Used to get the Permission by list by Id.
   * @param data
   * @returns
   */
  getPermissionDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/PermissionMaster/GetPermissionDataById?id=${id}`, this.options);
  }

  /**
   * Used to get the Permission by list.
   * @param data
   * @returns
   */
  getPermissionsList(pageNumber: number, pageSize: number): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/PermissionMaster/GetPermissionsList?PageNumber=${pageNumber}&PageSize=${pageSize}`,
      this.options,
    );
  }

  /**
   * Used to Delete the Permission.
   * @param data
   * @returns
   */
  deletePermissionRecord(id: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/PermissionMaster/DeletePermissionRecord?id=${id}`, this.options);
  }
}
