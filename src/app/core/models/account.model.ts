// account.model.ts
export interface AddAccountRequest {
  companyName: string;
  email: string;
  phone1: string;
  website: string;
  aboutCompany: string;
  userId?: any;
}

export interface UpdateAccountRequest {
  userId: string;
  accountId: string;
  companyName: string;
  email: string;
  phone1: string;
  website: string;
  aboutCompany: string;
  phone2: string;
  tags: string;
  fax: string;
}

export interface UpdateAccountLicenseRequest {
  userId: string;
  accountId: string;
  licenseKey: string;
  licenseType: string;
  licenseStartDate: string; // ISO date string
  licenseEndDate: string; // ISO date string
  price: string;
  noOfInstance: number;
  noOfUser: number;
  noOfDatabase: number;
}

export interface UpdateAccountProfileRequest {
  profilePicture: string;
  userId: string;
  accountId: string;
  fileData: string;
  isImageUpdate: boolean;
}

export interface AccountDetail {
  // Define based on your API response
  accountId: string;
  fileData: string;
  companyName: string;
  createdDate?: string;
  email: string;
  phone1: string;
  website: string;
  aboutCompany: string;
  phone2?: string;
  tags?: string;
  fax?: string;
  profilePicture?: string;
  licenseKey?: string;
  licenseType?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  noOfInstance: number;
  noOfUser: number;
  price: string;
  noOfProjects: string;
  noOfDatabase: number;
  // Add other properties as needed
}

export interface GetAccountDetailListRequest {
  // Define based on what your API expects for the list endpoint
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AccountListResponse {
  accounts: AccountDetail[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
