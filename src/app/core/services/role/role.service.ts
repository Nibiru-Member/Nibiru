import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../models/common.model';
import { RolePermission, RolesRecord } from '../../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
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
  addRolesRecord(data: RolesRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/Role/AddRolesRecord`, data, this.options);
  }

  /**
   * Used to Assign Role Permission
   * @param data
   * @returns
   */
  assignRolePermissionsToRole(data: RolePermission): Observable<BaseResponse> {
    return this.httpService.post(`/api/Role/AssignRolePermissionsToRole`, data, this.options);
  }
  /**
   * Used to Update Roles.
   * @param data
   * @returns
   */
  updateRoleRecord(data: RolesRecord): Observable<BaseResponse> {
    return this.httpService.put(`/api/Role/UpdateRoleRecord`, data, this.options);
  }
  /**
   * Used to get Roles by Id.
   * @param id
   * @returns
   */
  getRoleDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Role/GetRoleDataById?id=${id}`, this.options);
  }

  /**
   * Used to get Permission by RoleId.
   * @param id
   * @returns
   */
  getRolePermissionsDataByRoleId(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Role/GetRolePermissionsDataByRoleId?roleId=${id}`, this.options);
  }

  /**
   * Used to get Role List.
   * @param pageNumber
   * @param pageSize
   * @returns
   */
  getRolesList(pageNumber: number, pageSize: number, searchKey: string): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/Role/GetRolesList?PageNumber=${pageNumber}&PageSize=${pageSize}&searchKey=${searchKey}`,
      this.options,
    );
  }

  /**
   * Used to delete Roles.
   * @param id
   * @returns
   */
  deleteRoleRecord(id: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/Role/DeleteRoleRecord/${id}`, this.options);
  }
}
