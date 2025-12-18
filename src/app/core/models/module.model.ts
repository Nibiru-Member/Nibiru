export interface ModuleRecord {
  id: any;
  moduleName?: string;
  name?: string;
  description?: string;
  isActive: boolean;
}

export interface ModulePermision {
  id?: any;
  moduleId: string;
  action: string;
  description: string;
  isActive: boolean;
}
