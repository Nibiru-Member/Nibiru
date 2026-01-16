export interface ServerConnection {
  serverType: string;
  serverName: string;
  authenticationType: string;
  username: string;
  password: string;
  rememberPassword: boolean;
  userId: string;
}

export interface Databases {
  server: string;
  username: string;
  password: string;
}
export interface DatabaseTable {
  server: string;
  database: string;
  username: string;
  password: string;
}
export interface DatabaseTableColunm {
  server: string;
  database: string;
  table: string;
  username: string;
  password: string;
}

export interface attachDatabasePayload {
  databaseName: string;
  mdfFilePath: string;
  ldfFilePath: string;
}
export interface ReorganizeIndexRequestDto {
  databaseName: string;
  tableName: string;
  indexName: string;
  fragmentationThreshold: number;
  linkedServerName: string | null;
}

export interface IndexSettingsPayload {
  objectReorgSizeMin: number;
  objectReorgSizeMax: number;
  objectReorgSizeCurrent: number;
  objectRebuildSizeMin: number;
  objectRebuildSizeMax: number;
  objectRebuildSizeCurrent: number;
  ignoreThreshold: number;
  reorganizeThreshold: number;
  rebuildThreshold: number;
  heap: boolean;
  clustered: boolean;
  nonClustered: boolean;
  missingIndex: boolean;
  clusteredColumnstore: boolean;
  nonClusteredColumnstore: boolean;
  ignoreReadOnlyFilegroups: boolean;
  ignoreObjectPermissions: boolean;
  ignoreHeapWithCompression: boolean;
  onlyWhenRowsGreaterThan1000: boolean;
  fragmentationScanMode: string;
  dataCompression: string;
  fillFactor: number;
  maxDop: number;
  lobCompaction: boolean;
  sortInTempdb: boolean;
  padIndex: boolean;
  online: boolean;
  waitAtLowPriority: boolean;
  maxDuration: number;
  abortAfterWait: string;
  statisticsSamplePercent: number;
  statisticsNoRecompute: string;
  DatabaseName: string;
  TableName: string;
  IndexName: string; 
  FilterType: string;
  LinkedServerName: string | null;
}