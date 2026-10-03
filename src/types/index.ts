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
  | 'Kế hoạch'
  | 'Nghiên cứu'
  | 'Gian hàng'
  | 'Marketing'
  | 'Nội dung'
  | 'Vận hành'
  | 'Khách hàng'
  | 'Dữ liệu'
  | 'Báo cáo'
  | 'Khác'
  | string;

export interface TaskCollaborator {
  personId: string;
  roleId: RoleId;
  responsibility?: string;
}

export interface Task {
  id: string;
  title: string;
  category?: string;

  ownerPersonId: string;
  ownerRoleId: RoleId;

  collaborators: TaskCollaborator[];

  approverPersonId?: string;
  approverRoleId?: RoleId;

  status: TaskStatus;
  priority?: TaskPriority;

  dueAt?: string | null; // Format: YYYY-MM-DD or YYYY-MM-DDTHH:mm

  output: string; // OUTPUT CẦN BÀN GIAO

  note?: string;

  dependencyIds?: string[];

  customPosition?: {
    x: number;
    y: number;
  };

  createdAt: string;
  updatedAt: string;
}

export type LinkType = 'DEPENDENCY' | 'HANDOFF' | 'FEEDBACK';

export interface TaskLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  linkType: LinkType;
  label?: string;
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
