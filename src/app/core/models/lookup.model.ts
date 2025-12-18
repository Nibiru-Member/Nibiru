export interface LookupRecord {
  lookUpId?: string;
  userId: string;
  lookUpName: string;
  edit: number;
  isActive: boolean;
  createdDate?: any;
}

export interface SubLookupRecord {
  subLookUpId?: string;
  lookUpId?: string;
  userId: string;
  lookUpName: string;
  isActive: boolean;
  createdDate?: any;
}
