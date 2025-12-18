import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { Observable } from 'rxjs';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import {
  Policy,
  UpdatePolicyThreshold,
  UpdatePolicyFilter,
  UpdatePolicyDefragment,
  UpdatePolicyNotifications,
  UpdatePolicySchedule,
  UpdatePolicyTargetSelection,
  UpdateStatusPayload,
} from '../../models/policy.model';

@Injectable({
  providedIn: 'root',
})
export class PolicyService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  // Policy Methods

  /**
   * Used to Create a new Policy
   * @param data
   * @returns
   */
  addPolicy(data: Policy): Observable<BaseResponse> {
    return this.httpService.post(`/api/Policy/AddPolicy`, data, this.options);
  }

  /**
   * Used to update the Policy Threshold
   * @param data
   * @returns
   */
  updatePolicyThreshold(data: UpdatePolicyThreshold): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyThresold`, data, this.options);
  }

  /**
   * Used to update the Policy Filter
   * @param data
   * @returns
   */
  updatePolicyFilter(data: UpdatePolicyFilter): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyFilter`, data, this.options);
  }

  /**
   * Used to get Policy Detail by ID
   * @param policyId
   * @returns
   */
  getPolicyDetailById(policyId: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Policy/GetPolicyDetailById/${policyId}`, this.options);
  }

  /**
   * Used to get Policy Detail List
   * @returns
   */
  getPolicyDetailList(PageNumber: number, PageSize: number, SearchKey: any): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/Policy/GetPolicyDetailList?PageNumber=${PageNumber}&PageSize=${PageSize}&SearchKey=${SearchKey}`,
      this.options,
    );
  }
  /**
   * Used to get Policy Detail List
   * @returns
   */
  GetResourceCheckConfigList(): Observable<BaseResponse> {
    return this.httpService.get(`/api/Policy/GetResourceCheckConfigList`, this.options);
  }

  /**
   * Used to update the Policy Defragment
   * @param data
   * @returns
   */
  UpdatePolicyResourceConfig(data: UpdatePolicyDefragment): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyResourceConfig`, data, this.options);
  }
  /**
   * Used to update the Policy Target
   * @param data
   * @returns
   */
  updatePolicyTargetSelection(data: UpdatePolicyTargetSelection): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyTargetSelection`, data, this.options);
  }
  /**
   * Used to update the Policy Defragment
   * @param data
   * @returns
   */
  updatePolicyDefragment(data: UpdatePolicyDefragment): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyDefragment`, data, this.options);
  }
  /**
   * Used to update the Policy Schedule
   * @param data
   * @returns
   */
  updatePolicySchedule(data: UpdatePolicySchedule): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicySchedule`, data, this.options);
  }
  /**
   * Used to update the Policy Notifications
   * @param data
   * @returns
   */
  updatePolicyNotifications(data: UpdatePolicyNotifications): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdatePolicyNotifications`, data, this.options);
  }
  CheckDynamicContentionConditions(paramKey: string, paramValue: any): Observable<BaseResponse> {
    console.log({ paramKey }, { paramValue }, '{paramKey}=${paramValue}');

    return this.httpService.get(`/api/Policy/CheckDynamicContentionConditions?${paramKey}=${paramValue}`);
  }

  // DropDown API for the Policy
  GetOwnerList(): Observable<BaseResponse> {
    return this.httpService.get(`/api/Dropdown/GetUserListForDropdown`, this.options);
  }
  GetPolicyCategory(lookName: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Dropdown/GetSubLookUpListForDropdown?lookName=${lookName}`, this.options);
  }
  UpdateStatusByModule(data: UpdateStatusPayload): Observable<BaseResponse> {
    return this.httpService.put(`/api/Policy/UpdateStatusByModule`, data, this.options);
  }
}
