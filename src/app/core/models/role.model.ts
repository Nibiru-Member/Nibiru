export interface RolesRecord {
  id?: string;
  name: string;
  isActive: boolean;
}

export interface RolePermission {
  roleId: string;
  permissionIds: string[];
}
