export interface LoginSignupUser {
  usernameOrMobile: string;
  password: string;
}

export interface LoginSignupUserMicrosoft {
  microsoftAccessToken: string;
}

export interface Login {
  code: string;
  redirectUri: string;
}

export interface LoginUserData {
  id: string;
  userName: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bearerToken: string;
  isAuthenticated: boolean;
  profilePhoto: string;
  userType: string;
  claims: ClaimsData[];
  accountId: string;
  accountName: string;
  age: number;
  city: string;
  country: string;
  dateOfBirth: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationName: string;
  employeeCode: string;
  employeeId: string;
  employeeLocation: employeeLocation[];
  employeeName: string;
  employeeType: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  profilePicture: string;
  reportManagerId: string;
  reportManagerName: string;
  roleId: string;
  roleName: string;
  isStaticPassword: boolean;
  state: string;
}
export interface AssetsData {
  employeeId: string;
  employeeLocation: employeeLocation[];
  id: string;
  accountId: string;
  accountName: string;
  amount: string;
  categoryName: string;
  categoryId: string;
  contractStartDate: string;
  createdByName: string;
  createdDate: string;
  createdIp: string;
  currency: string;
  dateOfIssue: string;
  description: string;
  installationDate: string;
  isActive: string;
  issuesParesse: string;
  locationId: string;
  locationName: string;
  machineExpiryDate: string;
  make: string;
  model: string;
  modifiedIp: string;
  oemSerialNumber: string;
  iownedLeased: string;
  ownerId: string;
  ownerName: string;
  poNumber: string;
  productId: string;
  productName: string;
  productType: string;
  productTypeId: string;
  purchaseDate: string;
  purposeProcess: string;
  quantity: string;
  relatedTo: string;
  relatedToId: string;
  relatedToName: string;
  remark: string;
  saleDate: string;
  serialNumber: string;
  softwareCategory: string;
  softwareCategoryId: string;
  softwareType: string;
  softwareTypeId: string;
  status: string;
  statusId: string;
  subCategoryName: string;
  subCategoryId: string;
  transactionNumber: string;
  type: string;
  vendorId: string;
  vendorName: string;
  warranty: string;
  warrantyEndDate: string;
  warrantyStartDate: string;
}
export interface employeeLocation {
  locationId: string;
  locationName: string;
}

export interface ClaimsData {
  claimType: string;
  claimValue: boolean;
}

export interface AuthResponse {
  userId: string;
  userProfilePic: string;
  userName?: string;
  fullName?: string;
  email?: string;
  phoneNumber: string;
  passwordhash: string;
  failedLoginCount: number;
  isActive: boolean;
  activeSessionId: string;
  lockoutUntil: string;
  roles: AuthRole[];
  modulePermission: PermissionModel[];
  token: string;
}

export interface AuthRole {
  roleName: string;
}

export interface PermissionModel {
  permissionId: string;
  action: string;
  description: string;
}
