export interface UserRecord {
  userId?: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  Base64Password?: string;
  base64Password?: string;
  phoneNumber: string;
  companyName?: string;
  address?: string;
  userRolesData?: { roleId: string }[];
  accountId?: any;
  isActive?: boolean;
  userProfilePic?: File | null;
}

export interface Role {
  roleId: string;
}

export interface UserNewPassword {
  id: string;
  newPassword: string;
  token: string;
}

export interface UserResetPassword {
  email: string;
  url: string;
}

export interface UserDetail {
  userId: string;
  sessionId: string;
}

export interface UserPermissions {
  userId: string;
  permissionIds: string[];
}

export interface User {
  id: string;
  accountId?: string;
  name: string;
  userName: string;
  userProfilePic?: string | null;
  email: string;
  phoneNumber: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastActivityAt?: string | null;
}
