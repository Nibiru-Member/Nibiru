import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { LookupRecord, SubLookupRecord } from '../../models/lookup.model';

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private httpService = inject(HttpService);

  // Set headers
  private headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });

  private options = { headers: this.headers };

  constructor() {}

  /**
   * 🔘 POST: Save or update a LookUp record
   * @param data - The LookUp data to save or update
   * @returns Observable<BaseResponse>
   */
  saveAndUpdateLookUp(data: LookupRecord): Observable<BaseResponse> {
    return this.httpService.post('/api/LookUp/SaveAndUpdateLookUp', data, this.options);
  }

  /**
   * 🔘 POST: Save or update a SubLookUp record
   * @param data - The SubLookUp data to save or update
   * @returns Observable<BaseResponse>
   */
  saveAndUpdateSubLookUp(data: SubLookupRecord): Observable<BaseResponse> {
    return this.httpService.post('/api/LookUp/SaveAndUpdateSubLookUp', data, this.options);
  }

  /**
   * 🔍 GET: Fetch LookUp data by ID
   * @param id - The ID of the LookUp record
   * @returns Observable<BaseResponse>
   */
  getLookUpDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/LookUp/GetLookUpDataById?lookUpId=${id}`, this.options);
  }

  /**
   * 🔍 GET: Fetch the full LookUp list
   * @returns Observable<BaseResponse>
   */
  getLookUpList(pageNumber: number, pageSize: number, searchKey: string): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/LookUp/GetLookUpList?PageNumber=${pageNumber}&PageSize=${pageSize}&searchKey=${searchKey}`,
      this.options,
    );
  }

  /**
   * 🔍 GET: Fetch SubLookUp data by ID
   * @param id - The ID of the SubLookUp record
   * @returns Observable<BaseResponse>
   */
  getSubLookUpDataById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/LookUp/GetSubLookUpDataById?id=${id}`, this.options);
  }

  /**
   * 🔍 GET: Fetch the full SubLookUp list
   * @returns Observable<BaseResponse>
   */
  getSubLookUpListRecord(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/LookUp/GetSubLookUpListRecord?LookupId=${id}`, this.options);
  }

  /**
   * ❌ DELETE: Delete a LookUp record by ID
   * @param id - The ID of the LookUp record to delete
   * @returns Observable<BaseResponse>
   */
  deleteLookUpRecordById(id: string, userId: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/LookUp/DeleteLookUpDataById?lookUpId=${id}&userId=${userId}`, this.options);
  }

  /**
   * ❌ DELETE: Delete a SubLookUp record by ID
   * @param id - The ID of the SubLookUp record to delete
   * @returns Observable<BaseResponse>
   */
  deleteSubLookUpRecordById(id: string, userid: string): Observable<BaseResponse> {
    return this.httpService.delete(`/api/LookUp/DeleteSubLookUpRecordById/${id}/${userid}`, this.options);
  }
}
