export interface Database {
  server: string;
  username?: boolean;
  password?: boolean;
  active?: boolean;
}

export interface DatabaseTable {
  ServerName: string;
  UserName?: boolean;
  Password?: boolean;
  DatabaseName?: boolean;
}
