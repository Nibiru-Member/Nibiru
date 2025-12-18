import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { Observable } from 'rxjs';
import { ModulePermision, ModuleRecord } from '../../models/module.model';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ModuleService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  /**
   * Used to Create the Module Record
   * @param data
   * @returns
   */
  addModuleRecord(data: ModuleRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/ModuleMaster/AddModuleRecord`, data, this.options);
  }

  /**
   * Used to update the Module Record
   * @param data
   * @returns
   */
  updateModuleRecord(data: ModuleRecord): Observable<BaseResponse> {
    return this.httpService.put(`/api/ModuleMaster/UpdateModuleRecord`, data, this.options);
  }

  /**
   * Userd to show the Module List by ID.
   * @param id
   * @returns
   */
  getModuleDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/ModuleMaster/GetModuleDataById?id=${id}`, this.options);
  }

  /**
   * Used to show the Module List.
   * @param pageNumber
   * @param pageSize
   * @returns
   */
  getModulesList(pageNumber: number, pageSize: number, searchKey?: string): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/ModuleMaster/GetModulesList?PageNumber=${pageNumber}&PageSize=${pageSize}&searchKey=${searchKey}`,
      this.options,
    );
  }
  /**
   * Used to delete the Module Record.
   * @param id
   * @returns
   */
  deleteModuleRecord(id: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/ModuleMaster/DeleteModuleRecord/${id}`, this.options);
  }

  // Module Permision
  /**
   * Used to Create the Module Permission Record
   * @param data
   * @returns
   */
  addModulePermissionRecord(data: ModulePermision): Observable<BaseResponse> {
    return this.httpService.post(`/api/PermissionMaster/AddPermissionRecord`, data, this.options);
  }

  /**
   * Used to update the Module Permission Record
   * @param data
   * @returns
   */
  updateModulePermissionRecord(data: ModulePermision): Observable<BaseResponse> {
    return this.httpService.put(`/api/PermissionMaster/UpdatePermissionRecord`, data, this.options);
  }

  /**
   * Userd to show the Module  Permission List by ID.
   * @param id
   * @returns
   */
  getModulePermissionDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/PermissionMaster/GetPermissionDataById?id=${id}`, this.options);
  }

  /**
   * Used to show the Module Permission List.
   * @param pageNumber
   * @param pageSize
   * @returns
   */
  getModulesPermissionList(moduleId: string, PageNumber: number, PageSize: number): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/PermissionMaster/GetPermissionsList?ModuleId=${moduleId}&PageNumber=${PageNumber}&PageSize=${PageSize}`,
      this.options,
    );
  }
  /**
   * Used to delete the Module Permission Record.
   * @param id
   * @returns
   */
  deleteModulePermission(id: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/PermissionMaster/DeletePermissionRecord/${id}`, this.options);
  }
}
