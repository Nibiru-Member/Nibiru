import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../models/common.model';
import { HttpService } from '../http/http.service';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  /** ✅ POST /api/Server/GetDatabases */
  getDatabases(data: { server: string; username: string; password: string }): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/GetDatabases`, data, this.options);
  }

  /** ✅ GET /api/Server/GetDatabaseObjectsFromServer */
  getDatabaseObjectsFromServer(params: {
    ServerName: string;
    UserName: string;
    Password: string;
    DatabaseName: string;
  }): Observable<BaseResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.httpService.get(`/api/Server/GetDatabaseObjectsFromServer?${query}`, this.options);
  }
  // Disconnect the Server
  disconnectedServerConnection(userId: string, connectionId: string): Observable<any> {
    return this.httpService.put(`/api/Server/DisconnectedServerConnection/${userId}/${connectionId}`, this.options);
  }
}
