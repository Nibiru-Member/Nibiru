import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../models/common.model';
import { TemplateRecord } from '../../models/template.model';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  addTemplate(data: TemplateRecord): Observable<BaseResponse> {
    return this.httpService.post(`/api/Template/AddTemplate`, data, this.options);
  }

  updateTemplate(data: TemplateRecord): Observable<BaseResponse> {
    return this.httpService.put(`/api/Template/UpdateTemplate`, data, this.options);
  }

  getTemplateById(id: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Template/GetTemplateById?id=${id}`, this.options);
  }

  getTemplateList(pageNumber: number, pageSize: number): Observable<BaseResponse> {
    return this.httpService.get(
      `/api/Template/GetTemplateList?PageNumber=${pageNumber}&PageSize=${pageSize}`,
      this.options,
    );
  }
}
