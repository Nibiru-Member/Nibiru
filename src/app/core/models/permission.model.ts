export interface PermissionRecord {
  id?: string;
  moduleId: string;
  action: string;
  description: string;
  isActive: boolean;
}
