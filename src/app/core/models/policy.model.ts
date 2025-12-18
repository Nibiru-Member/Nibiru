export interface PolicyDetail {
  isAllIndex: any;
  ownerName: any;
  isMDF: any;
  isAutomate: any;
  isReorganize: any;
  isRebuildOnline: any;
  emailRecipients: any;
  isBackup: any;
  maxPageCount: any;
  scanDensityThreshold: any;
  categoryName: any;
  fillFactorNewValue: any;
  recompiledSP: any;
  primaryIndexSorting: any;
  minPageCount: any;
  policyId: any;
  serverName?: string;
  fragmentationThreshold?: string;
  policyName?: string;
  description?: string;
  schedule?: string;
  category?: any;
  name: string;
  lastRun?: string;
  nextRun?: string;
  status?: any;
  server?: string;
  owner?: string;
  target?: string;
  analysisRenewal?: string;
  IsAllIndex: boolean;
  optimizationThreshold?: string;
  pageCount?: string;
  qualifiedIndexes?: string;
  orderBy?: string;
  defragmentAction?: string;
  automatedResponse?: string;
  updateStatistics?: string;
  scheduleStatus?: string;
  scheduleTime?: string;
  restrictions?: string;
  fillFactor?: string;
  scheduleType?: string;
  restrictionEndTime?: string;
  restrictionStartTime?: string;
  isEnabled?: any;
}

export interface Policy {
  name: string;
  description: string;
  userId: string;
  categoryId: any;
  ownerId: string;
  serverName: any;
  policyId?: string;
}

export interface UpdatePolicyThreshold {
  userId: string;
  policyId: string;
  isFragmentation: boolean;
  fragmentationThreshold: number;
  isScanDensity: boolean;
  scanDensityThreshold: number;
}

export interface UpdatePolicyFilter {
  userId: string;
  policyId: string;
  isMinPageCount: boolean;
  minPageCount: number;
  isMaxPageCount: boolean;
  maxPageCount: number;
  primaryIndexSorting: string;
}
export interface UpdatePolicyTargetSelection {
  policyId: string;
  accountId: string;
  serverName: string;
  isAllIndex: boolean;

  databases: {
    databaseName: string;
    selections: Selection[];
  }[];
}

export interface Selection {
  objectType: string;
  objectName: string;
}
export interface UpdatePolicyDefragment {
  userId: string;
  policyId: string;
  isReorganize: boolean;
  updateStatistics: string;
  updateRecompiledSP: string;
  isRebuildOnline: boolean;
  fillFactorCurrentValue: string;
  fillFactorNewValue: string;
  statisticsMethod: any;
  useNoRecompute: any;
  isIndex: boolean;
  isMdf: boolean;
  isIndexMDF: boolean;
  isAutomate: boolean;
  isBackup: boolean;
}
export interface UpdatePolicyResource {
  userId: string;
  checkId: string;
  checkName: string;
  comparisonOperator: string;
  thresholdOldValue: any;
  thresholdNewValue: any;
  policyId: string;
}
export interface UpdatePolicySchedule {
  userId: string;
  policyId: string;
  scheduleType: string;
  scheduleStartTime: string;
  onSunday: boolean;
  onMonday: boolean;
  onTuesday: boolean;
  onWednesday: boolean;
  onThursday: boolean;
  onFriday: boolean;
  onSaturday: boolean;
  restrictionStartTime: string;
  restrictionEndTime: string;
  isSchedule: boolean;
}
export interface UpdatePolicyNotifications {
  userId: string;
  policyId: string;
  policyStarted: boolean;
  policyCompleted: boolean;
  policyCanceled: boolean;
  policyExpired: boolean;
  policyDisabled: boolean;
  policyFailed: boolean;
  policyDelayed: boolean;
  emailRecipients: string;
}
export interface DynamicContentionConditionsRequest {
  activeSessionCountThreshold?: any;
  sqlInstanceCPUThreshold?: any | null;
  memoryUsageThreshold?: any | null;
  excludedJobName?: any | null;
  executingJobCountThreshold?: any | null;
  usersLoggedInThreshold?: any | null;
  activeTransactionCountThreshold?: any | null;
  transactionLogUsageThreshold?: any | null;
  totalServerCPUThreshold?: any | null;
  delayTimeoutMinutes?: any | null;
}

export interface UpdateStatusPayload {
  moduleName: string;
  recordId: string;
  newStatus: boolean;
}
