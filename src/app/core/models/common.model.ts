export interface BaseResponse {
  [x: string]: any;
  success?: boolean;
  message?: string;
  data?: any;
  errors?: string[];
  statusCode?: number;
  totalCount?: number;
}

export interface pageSelection {
  skip: number;
  limit: number;
}

export interface StatusPayload {
  id?: number;
  pageNumber: number;
  pageSize: number;
  statusType: string;
}

export interface StatusData {
  id: number;
  parentId: number;
  name: string;
  createdDate: string;
  statusType: string;
  subLookUpId: string;
  subLookUpName: string;
  relatedTo: string;
  isActive: boolean;
}

export interface Notes {
  relatesTo: string;
  relatesToId: string;
  relatesToName: string;
  noteType: string;
  noteDescription: string;
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  nextFollowUpTime: string;
  userId: string;
}

export interface SubLookUpModel {
  createdDate: string;
  isActive: boolean;
  lookUpId: string;
  lookUpName: string;
  subLookUpId: string;
}

export interface CountryModel {
  countryId: number;
  countryName: string;
  capital: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  isO2: string;
  isO3: string;
  latitude: number;
  longitude: number;
  nationality: string;
  phoneCode: number;
  regionId: number;
  subRegionId: number;
  subRegionName: string;
}

export interface StateModel {
  stateId: number;
  stateName: string;
  countryCode: string;
  countryId: number;
  countryName: string;
  latitude: number;
  longitude: number;
  stateCode: string;
}

export interface CityModel {
  cityId: number;
  cityName: string;
  countryCode: string;
  countryId: number;
  countryName: string;
  latitude: number;
  longitude: number;
  stateCode: string;
  stateId: number;
  stateName: string;
}

export interface priorityModel {
  priorityId: string;
  createdDate: string;
  isActive: boolean;
  lookUpId: string;
  lookUpName: string;
  subLookUpId: string;
}

export interface employeeListModel {
  departmentName: string;
  designationName: string;
  employeeCode: string;
  employeeId: number;
  employeeName: string;
  assignToId: number;
  assignToName: string;
}

export interface ActionTypeRecord {
  actionType: string;
  maxDayFuture: number;
  maxDayPast: number;
}

export interface Activities {
  accountId: string;
  accountName: string;
  activityActionName: string;
  activityById: string;
  activityDescription: string;
  activityId: number;
  activityRelatedTo: string;
  activityRelatedToId: string;
  activityRelatedToName: string;
  activityStatus: string;
  activityTime: string;
  locationId: string;
  locationName: string;
  remoteIP: string;
  userId: string;
}

export interface DecodedArgon2 {
  type: string;
  version: number;
  memoryCost: number;
  timeCost: number;
  parallelism: number;
  saltHex: string;
  hashHex: string;
}
