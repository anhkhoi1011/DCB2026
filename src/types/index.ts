export type RoleId = 1 | 2 | 3 | 4;

export interface Role {
  id: RoleId;
  code: string;
  name: string;
  colorName: 'blue' | 'purple' | 'green' | 'orange';
  hexColor: string;
  lightBg: string;
  badgeBg: string;
  badgeText: string;
  borderLight: string;
  generalDuties: string[];
  sortOrder: number;
  active: boolean;
}

export interface Person {
  id: string;
  fullName: string;
  shortName: string;
  roleId: RoleId;
  avatarUrl?: string;
  isPrimary: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'ON_HOLD';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskCategory =
  | 'Nghiên cứu'
  | 'Kế hoạch'
  | 'Gian hàng'
  | 'Marketing'
  | 'Nội dung'
  | 'Vận hành'
  | 'Dữ liệu'
  | 'Khách hàng'
  | 'Báo cáo'
  | 'Khác';

export type RelationType = 'OWNER' | 'COLLABORATOR' | 'APPROVER';

export interface TaskParticipant {
  id: string;
  taskId: string;
  roleId: RoleId;
  relationType: RelationType;
  responsibility?: string;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  text: string;
  assigneeRoleId?: RoleId;
  completed: boolean;
  sortOrder: number;
}

export type LinkType = 'DEPENDENCY' | 'HANDOFF' | 'FEEDBACK';

export interface TaskLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  linkType: LinkType;
  label?: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  ownerRoleId: RoleId;
  collaboratorRoleIds: RoleId[];
  approverRoleId?: RoleId;
  participantRoleIds: RoleId[];
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  howTo?: string;
  definitionOfDone?: string;
  inputs?: string[];
  outputs?: string[];
  responsibilitiesByRole: Partial<Record<RoleId, string>>;
  dueDate?: string; // YYYY-MM-DD
  startDate?: string;
  manualProgress?: number; // 0 - 100 when no checklist
  notes?: string;
  customPosition?: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AppSettings {
  projectName: string;
  teamName: string;
  theme: 'light' | 'dark' | 'system';
  isLockedLayout: boolean;
  showDependenciesOnTrace: boolean;
  onboardingCompleted: boolean;
}

export interface SyncState {
  spreadsheetUrl: string;
  spreadsheetId: string;
  sheetTitle?: string;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime?: string;
  errorMessage?: string;
  syncLogs: Array<{
    id: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error' | 'info';
    message: string;
  }>;
}
