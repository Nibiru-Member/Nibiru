import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import {
  AddAccountRequest,
  UpdateAccountRequest,
  UpdateAccountLicenseRequest,
  UpdateAccountProfileRequest,
  AccountDetail,
  GetAccountDetailListRequest,
  AccountListResponse,
} from '../../models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private httpService = inject(HttpService);

  private headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  private options = { headers: this.headers };

  constructor() {}

  /**
   * POST - Add new account
   * /api/Account/AddAccount
   */
  addAccount(data: AddAccountRequest): Observable<BaseResponse> {
    return this.httpService.post(`/api/Account/AddAccount`, data, this.options);
  }

  /**
   * PUT - Update account details
   * /api/Account/UpdateAccount
   */
  updateAccount(data: UpdateAccountRequest): Observable<BaseResponse> {
    return this.httpService.put(`/api/Account/UpdateAccount`, data, this.options);
  }

  /**
   * PUT - Update account license
   * /api/Account/UpdateAccountLicense
   */
  updateAccountLicense(data: UpdateAccountLicenseRequest): Observable<BaseResponse> {
    return this.httpService.put(`/api/Account/UpdateAccountLicense`, data, this.options);
  }

  /**
   * PUT - Update account profile
   * /api/Account/UpdateAccountProfile
   */
  updateAccountProfile(formData: FormData): Observable<BaseResponse> {
    return this.httpService.put(`/api/Account/UpdateAccountProfile`, formData, this.options);
  }

  /**
   * GET - Get account detail by Id
   * /api/Account/GetAccountDetailById/{accountId}
   */
  getAccountDetailById(accountId: string): Observable<AccountDetail> {
    return this.httpService.get(`/api/Account/GetAccountDetailById/${accountId}`, this.options);
  }

  /**
   * POST - Get account detail list
   * /api/Account/GetAccountDetailList
   */
  getAccountDetailList(pageNumber: number, pageSize: number, searchKey: string): Observable<AccountListResponse> {
    return this.httpService.get(
      `/api/Account/GetAccountDetailList?pageNumber=${pageNumber}&pageSize=${pageSize}&searchKey=${searchKey}`,
      this.options,
    );
  }

  /**
   * DELETE - Delete account by accountId and userId
   * /api/Account/DeleteAccount/{accountId}/{userId}
   */
  deleteAccount(accountId: string, userId: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/Account/DeleteAccount/${accountId}/${userId}`, this.options);
  }
}
