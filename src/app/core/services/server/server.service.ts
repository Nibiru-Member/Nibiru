import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { BaseResponse } from '../../models/common.model';
import { Observable } from 'rxjs';
import {
  attachDatabasePayload,
  Databases,
  DatabaseTable,
  DatabaseTableColunm,
  ServerConnection,
} from '../../models/server.model';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  headers = new HttpHeaders({
    clientId: 'Nibiru-Software',
    clientSecret: 'Nibiru-Software-Secret',
  });
  options = { headers: this.headers };

  private httpService = inject(HttpService);
  constructor() {}

  createServerConnection(data: ServerConnection): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/CreateServerConnection`, data, this.options);
  }
  connectServerConnection(data: ServerConnection): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/ConnectServerConnection`, data, this.options);
  }

  getDatabases(data: Databases): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/GetDatabases`, data, this.options);
  }
  getDatabaseTables(data: DatabaseTable): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/getDatabaseTables`, data, this.options);
  }
  getDatabaseTablesColumns(data: DatabaseTableColunm): Observable<BaseResponse> {
    return this.httpService.post(`/api/Server/GetDatabaseTablesColumns`, data, this.options);
  }

  getUserServerList(userId: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Server/GetUserServerList?userId=${userId}`, this.options);
  }
  getServerConnectionByUser(userId: string, accountId: string): Observable<BaseResponse> {
    return this.httpService.get(`/api/Server/GetServerConnectionByUser/${userId}/${accountId}`, this.options);
  }

  // Dashboard
  getTopFragmentedMdfFiles(FilterType?: string, DatabaseName?: any): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetTopFragmentedMdfFiles?FilterType=${FilterType}&DatabaseName=${DatabaseName}`,
      this.options,
    );
  }
  getTopFragmentedIndex(DatabaseName: string, FilterType: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetTopFragmentedIndex?DatabaseName=${DatabaseName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  getFillFactorCorrection(DatabaseName: string, FilterType: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetFillFactorCorrection?DatabaseName=${DatabaseName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  getTotalFragmentation(DatabaseName: string, FilterType: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetTotalFragmentation?DatabaseName=${DatabaseName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  getServerConnectionByServerNam(serverName: string): Observable<any> {
    return this.httpService.get(`/api/Server/GetServerConnectionByServerNam/${serverName}`, this.options);
  }

  GetDiskStorage(serverName: string, UserName: string, Password: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetDiskStorage?ServerName=${serverName}&UserName=${UserName}&Password=${Password}`,
      this.options,
    );
  }

  // API
  GetIndexFilesReview(DatabaseName: string, TableName: string, IndexName: string, FilterType: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetIndexFilesReview?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  GetIndexStorageUtilization(
    DatabaseName: string,
    TableName: string,
    IndexName: string,
    FilterType: string,
  ): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetIndexStorageUtilization?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  GetIndexFillFactorCorrelation(
    DatabaseName: string,
    TableName: string,
    IndexName: string,
    FilterType: string,
  ): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetIndexFillFactorCorrelation?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  GetIndexFillFactoryHistory(
    DatabaseName?: string,
    TableName?: string,
    IndexName?: string,
    FilterType?: string,
  ): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetIndexFillFactoryHistory?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  GetTotalIndexFragmentation(
    DatabaseName?: string,
    TableName?: string,
    IndexName?: string,
    FilterType?: string,
  ): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetTotalIndexFragmentationTrend?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}`,
      this.options,
    );
  }
  GetServerMetrics(): Observable<any> {
    return this.httpService.get(`/api/Dashboard/GetServerMetrics`, this.options);
  }
  GetServerHealthStatus(): Observable<any> {
    return this.httpService.get(`/api/Dashboard/GetServerHealthStatus`, this.options);
  }
  SafeAttachDatabase(data: attachDatabasePayload): Observable<BaseResponse> {
    return this.httpService.post(`/api/Dashboard/SafeAttachDatabase`, data, this.options);
  }
  SafeDetachDatabase(data: any): Observable<BaseResponse> {
    return this.httpService.put(`/api/Dashboard/SafeDetachDatabase`, data, this.options);
  }
  DetachDatabase(data: any): Observable<BaseResponse> {
    return this.httpService.put(`/api/Dashboard/DetachDatabase`, data, this.options);
  }
  BackupDatabase(data: any): Observable<BaseResponse> {
    return this.httpService.put(`/api/Dashboard/BackupDatabase`, data, this.options);
  }
  DefragmentMDF(data: any): Observable<BaseResponse> {
    return this.httpService.put(`/api/Dashboard/DefragmentMDF`, data, this.options);
  }
  GetDefragmentationLogByLog(logId: string): Observable<any> {
    return this.httpService.get(`/api/Dashboard/GetDefragmentationLogByLogId?logId=${logId}`, this.options);
  }
  GetDiskDriveListForDropdown(ServerName: string, UserName: string, Password: string): Observable<any> {
    return this.httpService.get(
      `/api/Dropdown/GetDiskDriveListForDropdown?ServerName=${ServerName}&UserName=${UserName}&Password=${Password}`,
      this.options,
    );
  }
  GetBasicDriveFolderTreeForDropdown(
    ServerName: string,
    UserName: string,
    Password: string,
    DriveLetter: string,
  ): Observable<any> {
    return this.httpService.get(
      `/api/Dropdown/GetBasicDriveFolderTreeForDropdown?ServerName=${ServerName}&UserName=${UserName}&Password=${Password}&DriveLetter=${DriveLetter}`,
      this.options,
    );
  }

  getTablesAndIndexesForDropdown(DatabaseName: string, TableName: string): Observable<any> {
    return this.httpService.get(
      `/api/Dropdown/GetTablesAndIndexesForDropdown?DatabaseName=${DatabaseName}&TableName=${TableName}`,
      this.options,
    );
  }

  getDetailedTableFragmentation(DatabaseName: string, FragmentationThreshold: number): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetDetailedTableFragmentation?DatabaseName=${DatabaseName}&FragmentationThreshold=${FragmentationThreshold}`,
      this.options,
    );
  }

  analyzeSpecificMdf(DatabaseName: string, GenerateReport: boolean): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/AnalyzeSpecificMdf?DatabaseName=${DatabaseName}&GenerateReport=${GenerateReport}`,
      this.options,
    );
  }

  checkDatabaseConnections(DatabaseName: string): Observable<any> {
    return this.httpService.get(`/api/Dashboard/CheckDatabaseConnections?DatabaseName=${DatabaseName}`, this.options);
  }

  toggleTableOnlineStatus(data: any): Observable<any> {
    return this.httpService.put(`/api/Dashboard/ToggleTableOnlineStatus`, data, this.options);
  }
}
