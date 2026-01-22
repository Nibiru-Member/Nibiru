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
    const linkedServerName = localStorage.getItem('linkedServerName');
    // Get server name from stored connection
    let serverName = '';
    try {
      const connectionStr = localStorage.getItem('lastServerConnection');
      if (connectionStr) {
        const connection = JSON.parse(connectionStr);
        serverName = connection?.server || '';
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return this.httpService.get(
      `/api/Dashboard/GetTopFragmentedMdfFiles?FilterType=${FilterType}&DatabaseName=${DatabaseName}&LinkedServerName=${linkedServerName}&ServerName=${serverName}`,
      this.options,
    );
  }
  getTopFragmentedIndex(DatabaseName: string, FilterType: string): Observable<any> {
    const linkedServerName = localStorage.getItem('linkedServerName');
    return this.httpService.get(
      `/api/Dashboard/GetTopFragmentedIndex?DatabaseName=${DatabaseName}&FilterType=${FilterType}&LinkedServername=${linkedServerName}`,
      this.options,
    );
  }
  getFillFactorCorrection(DatabaseName: string, FilterType: string): Observable<any> {
    const linkedServerName = localStorage.getItem('linkedServerName');
    return this.httpService.get(
      `/api/Dashboard/GetFillFactorCorrection?DatabaseName=${DatabaseName}&FilterType=${FilterType}&LinkedServerName=${linkedServerName}`,
      this.options,
    );
  }
  getTotalFragmentation(DatabaseName: string, FilterType: string): Observable<any> {
    const linkedServerName = localStorage.getItem('linkedServerName');
    return this.httpService.get(
      `/api/Dashboard/GetTotalFragmentation?DatabaseName=${DatabaseName}&FilterType=${FilterType}&LinkedServerName=${linkedServerName}`,
      this.options,
    );
  }
  getServerConnectionByServerNam(serverName: string): Observable<any> {
    return this.httpService.get(`/api/Server/GetServerConnectionByServerNam/${serverName}`, this.options);
  }

  deleteUserServerList(userId: string, connectionId: string): Observable<BaseResponse> {
    return this.httpService.put(`/api/Server/DeleteUserServerList?userId=${userId}&ConnectionID=${connectionId}`, {}, this.options);
  }

  GetDiskStorage(serverName: string, UserName: string, Password: string): Observable<any> {
    return this.httpService.get(
      `/api/Dashboard/GetDiskStorage?ServerName=${serverName}&UserName=${UserName}&Password=${Password}`,
      this.options,
    );
  }

  // API
  GetIndexFilesReview(payload: {
    DatabaseName: string;
    TableName?: string;
    IndexName?: string;
    FilterType?: string;
    LinkedServerName?: string | null;
    objectReorgSizeMin?: number;
    objectReorgSizeMax?: number;
    objectReorgSizeCurrent?: number;
    objectRebuildSizeMin?: number;
    objectRebuildSizeMax?: number;
    objectRebuildSizeCurrent?: number;
    ignoreThreshold?: number;
    reorganizeThreshold?: number;
    rebuildThreshold?: number;
    heap?: boolean;
    clustered?: boolean;
    nonClustered?: boolean;
    missingIndex?: boolean;
    clusteredColumnstore?: boolean;
    nonClusteredColumnstore?: boolean;
    ignoreReadOnlyFilegroups?: boolean;
    ignoreObjectPermissions?: boolean;
    ignoreHeapWithCompression?: boolean;
    onlyWhenRowsGreaterThan1000?: boolean;
    fragmentationScanMode?: string;
    dataCompression?: string;
    fillFactor?: number;
    maxDop?: number;
    lobCompaction?: boolean;
    sortInTempdb?: boolean;
    padIndex?: boolean;
    online?: boolean;
    waitAtLowPriority?: boolean;
    maxDuration?: number;
    abortAfterWait?: string;
    statisticsSamplePercent?: number;
    statisticsNoRecompute?: string;
  }): Observable<any> {
    // Ensure LinkedServerName is included
    if (!payload.LinkedServerName) {
      payload.LinkedServerName = localStorage.getItem('linkedServerName');
    }
    return this.httpService.post(`/api/Dashboard/GetIndexFilesReview`, payload, this.options);
  }
  GetIndexStorageUtilization(
    DatabaseName: string,
    TableName: string,
    IndexName: string,
    FilterType: string,
  ): Observable<any> {
    const linkedServerName = localStorage.getItem('linkedServerName');
    return this.httpService.get(
      `/api/Dashboard/GetIndexStorageUtilization?DatabaseName=${DatabaseName}&TableName=${TableName}&IndexName=${IndexName}&FilterType=${FilterType}&LinkedServerName=${linkedServerName}`,
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
    const linkedServerName = localStorage.getItem('linkedServerName');
    data.linkedServerName = linkedServerName;
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

  getDetailedTableFragmentation(DatabaseName: string, FragmentationThreshold: number, linkedServerName?: string | null): Observable<any> {
    const linkedServerParam = linkedServerName ? `&LinkedServerName=${linkedServerName}` : '';
    return this.httpService.get(
      `/api/Dashboard/GetDetailedTableFragmentation?DatabaseName=${DatabaseName}&FragmentationThreshold=${FragmentationThreshold}${linkedServerParam}`,
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

  rebuildIndexes(data: {
    databaseName: string;
    tableName?: string;
    indexName?: string;
    fillFactor?: number;
    sortOrder?: string;
    maxDOP?: number;
    onlineRebuild?: boolean;
    updateStats?: boolean;
    recompileProcs?: boolean;
    fragmentationThreshold?: number;
  }): Observable<any> {
    const params = new URLSearchParams();
    const linkedServerName = localStorage.getItem('linkedServerName');
    params.append('DatabaseName', data.databaseName);
    if (data.tableName) params.append('TableName', data.tableName);
    if (data.indexName) params.append('IndexName', data.indexName);
    if (data.fillFactor !== undefined) params.append('FillFactor', data.fillFactor.toString());
    if (data.sortOrder) params.append('SortOrder', data.sortOrder);
    if (data.maxDOP !== undefined) params.append('MaxDOP', data.maxDOP.toString());
    if (data.onlineRebuild !== undefined) params.append('OnlineRebuild', data.onlineRebuild.toString());
    if (data.updateStats !== undefined) params.append('UpdateStats', data.updateStats.toString());
    if (data.recompileProcs !== undefined) params.append('RecompileProcs', data.recompileProcs.toString());
    if (data.fragmentationThreshold !== undefined) params.append('FragmentationThreshold', data.fragmentationThreshold.toString());
    if (linkedServerName) params.append('LinkedServerName', linkedServerName);

    return this.httpService.get(`/api/Dashboard/RebuildIndexes?${params.toString()}`, this.options);
  }

  reorganizeIndexes(data: {
    databaseName: string;
    tableName?: string;
    indexName?: string;
    fragmentationThreshold?: number;
  }): Observable<any> {
    const params = new URLSearchParams();
    params.append('DatabaseName', data.databaseName);
    if (data.tableName) params.append('TableName', data.tableName);
    if (data.indexName) params.append('IndexName', data.indexName);
    if (data.fragmentationThreshold !== undefined) {
      params.append('FragmentationThreshold', data.fragmentationThreshold.toString());
    } else {
      params.append('FragmentationThreshold', '10'); // Default threshold
    }
    const linkedServerName = localStorage.getItem('linkedServerName');
    if (linkedServerName) params.append('LinkedServerName', linkedServerName);
    return this.httpService.get(`/api/Dashboard/ReorganizeIndexes?${params.toString()}`, this.options);
  }

  analyzeIndex(data: {
    databaseName: string;
    tableName?: string;
    indexName?: string;
    generateReport?: boolean;
  }): Observable<any> {
    const params = new URLSearchParams();
    params.append('DatabaseName', data.databaseName);
    if (data.tableName) params.append('TableName', data.tableName);
    if (data.indexName) params.append('IndexName', data.indexName);
    if (data.generateReport !== undefined) {
      params.append('GenerateReport', data.generateReport.toString());
    } else {
      params.append('GenerateReport', 'true'); // Default to true
    }
    const linkedServerName = localStorage.getItem('linkedServerName');
    if (linkedServerName) params.append('LinkedServerName', linkedServerName);
    return this.httpService.get(`/api/Dashboard/AnalyzeIndex?${params.toString()}`, this.options);
  }
}
