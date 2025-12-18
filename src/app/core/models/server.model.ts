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
export interface DatabaseTableColunm {
  server: string;
  database: string;
  table: string;
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
