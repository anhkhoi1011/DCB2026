import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Role,
  Person,
  Task,
  TaskLink,
  AppSettings,
  SyncState,
  RoleId,
  TaskStatus,
  TaskPriority,
  TaskCollaborator,
} from '../types';
import {
  INITIAL_ROLES,
  INITIAL_PEOPLE,
  INITIAL_TASKS,
  INITIAL_TASK_LINKS,
  INITIAL_SETTINGS,
} from '../data/seedData';
import { calculateAutomaticLayout } from '../utils/layout';

export type NavigationTab =
  | 'overview'
  | 'map'
  | 'tasks'
  | 'members'
  | 'sheets'
  | 'settings';

interface AppStoreState {
  roles: Role[];
  people: Person[];
  tasks: Task[];
  taskLinks: TaskLink[];
  settings: AppSettings;
  syncState: SyncState;

  // View & UI Navigation
  activeTab: NavigationTab;
  sidebarCollapsed: boolean;
  selectedTaskId: string | null;
  selectedRoleId: RoleId | null;
  perspectivePersonId: string | null; // null means 'Tất cả'

  // Filters & Search
  searchQuery: string;
  filterStatus: TaskStatus | 'ALL';
  filterPriority: TaskPriority | 'ALL';
  filterRole: RoleId | 'ALL';
  filterPerson: string | 'ALL';
  filterCategory: string | 'ALL';
  filterDeadline: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'NO_DEADLINE';

  // Multi-select on Task List (Bulk Actions)
  selectedRowIds: string[];

  // Modal / Drawer controls
  isTaskFormOpen: boolean;
  editingTaskId: string | null;
  prefillFromTemplateId: string | null;
  isDrawerMinimized: boolean;
  drawerWidth: number;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  toggleSidebar: () => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedRoleId: (id: RoleId | null) => void;
  clearSelection: () => void;
  setPerspectivePersonId: (id: string | null) => void;
  setDrawerMinimized: (minimized: boolean) => void;
  toggleDrawerMinimized: () => void;
  setDrawerWidth: (width: number) => void;

  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: TaskStatus | 'ALL') => void;
  setFilterPriority: (priority: TaskPriority | 'ALL') => void;
  setFilterRole: (role: RoleId | 'ALL') => void;
  setFilterPerson: (personId: string | 'ALL') => void;
  setFilterCategory: (category: string | 'ALL') => void;
  setFilterDeadline: (deadline: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'NO_DEADLINE') => void;

  toggleSelectRow: (id: string) => void;
  selectAllRows: (ids: string[]) => void;
  clearRowSelection: () => void;

  openTaskForm: (taskId?: string, templateId?: string) => void;
  closeTaskForm: () => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskPosition: (id: string, pos: { x: number; y: number }) => void;
  resetLayout: () => void;

  // Bulk Actions
  bulkSetDueAt: (taskIds: string[], dueAt: string | null) => void;
  bulkSetStatus: (taskIds: string[], status: TaskStatus) => void;
  bulkSetPriority: (taskIds: string[], priority: TaskPriority) => void;
  bulkAssignOwner: (taskIds: string[], personId: string, roleId: RoleId) => void;
  bulkAddCollaborator: (taskIds: string[], collaborator: TaskCollaborator) => void;
  bulkDeleteTasks: (taskIds: string[]) => void;

  // Task Link Actions
  addTaskLink: (link: Omit<TaskLink, 'id'>) => void;
  deleteTaskLink: (id: string) => void;

  // Person / Member Actions
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  setPrimaryPerson: (roleId: RoleId, personId: string) => void;

  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  completeOnboarding: (
    projectName: string,
    teamName: string,
    names: Record<RoleId, string>,
    connectSheetNow: boolean
  ) => void;
  resetToSeedData: () => void;
  importData: (importedData: any) => void;

  // Sync State
  updateSyncState: (updates: Partial<SyncState>) => void;
  addSyncLog: (status: 'success' | 'warning' | 'error' | 'info', message: string) => void;
}

// 82 Old seed IDs to prune from active task list on migration
const OLD_82_SEED_IDS = new Set([
  'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
  'E1', 'E2', 'E3', 'E4',
  'F1', 'F2', 'F3', 'F4',
  'G1', 'G2', 'G3', 'G4',
  'H1', 'H2', 'H3', 'H4', 'H5',
  'I1', 'I2', 'I3', 'I4', 'I5',
  'J1', 'J2', 'J3', 'J4', 'J5', 'J6',
  'K1', 'K2',
  'L1_MKT', 'L2_MKT',
  'M1', 'M2',
  'N1', 'N2', 'N3',
  'O1', 'O2', 'O3', 'O4', 'O5',
]);

// Backup old state before migration
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const rawOld = window.localStorage.getItem('dbc-task-system-2026');
    if (rawOld && !window.localStorage.getItem('dbc-pre-refactor-backup')) {
      window.localStorage.setItem('dbc-pre-refactor-backup', rawOld);
    }
  } catch (e) {
    console.warn('Backup old state warning:', e);
  }
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      roles: INITIAL_ROLES,
      people: INITIAL_PEOPLE,
      tasks: INITIAL_TASKS,
      taskLinks: INITIAL_TASK_LINKS,
      settings: INITIAL_SETTINGS,
      syncState: {
        spreadsheetUrl: '',
        spreadsheetId: '',
        isConnected: false,
        isSyncing: false,
        syncLogs: [
          {
            id: 'log-1',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: 'info',
            message: 'Hệ thống DBC 2026 V2 khởi chạy ở chế độ Dữ liệu Nội bộ (Local Mode)',
          },
        ],
      },

      activeTab: 'overview',
      sidebarCollapsed: false,
      selectedTaskId: null,
      selectedRoleId: null,
      perspectivePersonId: null,

      searchQuery: '',
      filterStatus: 'ALL',
      filterPriority: 'ALL',
      filterRole: 'ALL',
      filterPerson: 'ALL',
      filterCategory: 'ALL',
      filterDeadline: 'ALL',

      selectedRowIds: [],

      isTaskFormOpen: false,
      editingTaskId: null,
      prefillFromTemplateId: null,
      isDrawerMinimized: false,
      drawerWidth: 380,

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSelectedTaskId: (id) => set({ selectedTaskId: id, selectedRoleId: null }),
      setSelectedRoleId: (id) => set({ selectedRoleId: id, selectedTaskId: null }),
      clearSelection: () => set({ selectedTaskId: null, selectedRoleId: null }),
      setDrawerMinimized: (minimized) => set({ isDrawerMinimized: minimized }),
      toggleDrawerMinimized: () => set((s) => ({ isDrawerMinimized: !s.isDrawerMinimized })),
      setDrawerWidth: (width) => set({ drawerWidth: Math.min(520, Math.max(280, width)) }),

      setPerspectivePersonId: (id) => {
        set({ perspectivePersonId: id, selectedRoleId: null, selectedTaskId: null });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setFilterRole: (role) => set({ filterRole: role }),
      setFilterPerson: (personId) => set({ filterPerson: personId }),
      setFilterCategory: (category) => set({ filterCategory: category }),
      setFilterDeadline: (deadline) => set({ filterDeadline: deadline }),

      toggleSelectRow: (id) => {
        set((state) => {
          const exists = state.selectedRowIds.includes(id);
          return {
            selectedRowIds: exists
              ? state.selectedRowIds.filter((rowId) => rowId !== id)
              : [...state.selectedRowIds, id],
          };
        });
      },

      selectAllRows: (ids) => {
        set((state) => ({
          selectedRowIds: state.selectedRowIds.length === ids.length ? [] : ids,
        }));
      },

      clearRowSelection: () => set({ selectedRowIds: [] }),

      openTaskForm: (taskId, templateId) =>
        set({
          isTaskFormOpen: true,
          editingTaskId: taskId || null,
          prefillFromTemplateId: templateId || null,
        }),

      closeTaskForm: () =>
        set({
          isTaskFormOpen: false,
          editingTaskId: null,
          prefillFromTemplateId: null,
        }),

      addTask: (newTaskData) => {
        const now = new Date().toISOString();
        const newTask: Task = {
          ...newTaskData,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          tasks: [...state.tasks, newTask],
          selectedTaskId: newTask.id,
          selectedRoleId: null,
        }));
      },

      updateTask: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          taskLinks: state.taskLinks.filter((l) => l.sourceTaskId !== id && l.targetTaskId !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
          selectedRowIds: state.selectedRowIds.filter((rowId) => rowId !== id),
        }));
      },

      updateTaskPosition: (id, pos) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, customPosition: pos } : t)),
        }));
      },

      resetLayout: () => {
        const { tasks } = get();
        const newPositions = calculateAutomaticLayout(tasks);
        set((state) => ({
          tasks: state.tasks.map((t) => ({
            ...t,
            customPosition: newPositions[t.id] || t.customPosition,
          })),
        }));
      },

      // Bulk Operations
      bulkSetDueAt: (taskIds, dueAt) => {
        const now = new Date().toISOString();
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.map((t) => (setIds.has(t.id) ? { ...t, dueAt, updatedAt: now } : t)),
          selectedRowIds: [],
        }));
      },

      bulkSetStatus: (taskIds, status) => {
        const now = new Date().toISOString();
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.map((t) => (setIds.has(t.id) ? { ...t, status, updatedAt: now } : t)),
          selectedRowIds: [],
        }));
      },

      bulkSetPriority: (taskIds, priority) => {
        const now = new Date().toISOString();
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.map((t) => (setIds.has(t.id) ? { ...t, priority, updatedAt: now } : t)),
          selectedRowIds: [],
        }));
      },

      bulkAssignOwner: (taskIds, personId, roleId) => {
        const now = new Date().toISOString();
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            setIds.has(t.id)
              ? {
                  ...t,
                  ownerPersonId: personId,
                  ownerRoleId: roleId,
                  // Remove this person from collaborators if they were in it
                  collaborators: (t.collaborators || []).filter((c) => c.personId !== personId),
                  updatedAt: now,
                }
              : t
          ),
          selectedRowIds: [],
        }));
      },

      bulkAddCollaborator: (taskIds, collaborator) => {
        const now = new Date().toISOString();
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (!setIds.has(t.id)) return t;
            // Check if already owner or collaborator
            if (t.ownerPersonId === collaborator.personId) return t;
            const existingCollabs = (t.collaborators || []).filter(
              (c) => c.personId !== collaborator.personId
            );
            return {
              ...t,
              collaborators: [...existingCollabs, collaborator],
              updatedAt: now,
            };
          }),
          selectedRowIds: [],
        }));
      },

      bulkDeleteTasks: (taskIds) => {
        const setIds = new Set(taskIds);
        set((state) => ({
          tasks: state.tasks.filter((t) => !setIds.has(t.id)),
          taskLinks: state.taskLinks.filter(
            (l) => !setIds.has(l.sourceTaskId) && !setIds.has(l.targetTaskId)
          ),
          selectedRowIds: [],
          selectedTaskId: state.selectedTaskId && setIds.has(state.selectedTaskId) ? null : state.selectedTaskId,
        }));
      },

      addTaskLink: (link) => {
        const id = `link-${Date.now().toString(36)}`;
        set((state) => ({
          taskLinks: [...state.taskLinks, { ...link, id }],
        }));
      },

      deleteTaskLink: (id) => {
        set((state) => ({
          taskLinks: state.taskLinks.filter((l) => l.id !== id),
        }));
      },

      addPerson: (personData) => {
        const now = new Date().toISOString();
        const newPerson: Person = {
          ...personData,
          id: `p-${Date.now().toString(36)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          people: [...state.people, newPerson],
        }));
      },

      updatePerson: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          people: state.people.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p)),
        }));
      },

      setPrimaryPerson: (roleId, personId) => {
        const now = new Date().toISOString();
        set((state) => {
          const updatedPeople = state.people.map((p) => {
            if (p.roleId === roleId) {
              return {
                ...p,
                isPrimary: p.id === personId,
                updatedAt: now,
              };
            }
            return p;
          });

          // Primary Person is the default suggestion for future task assignments.
          // DO NOT modify ownerPersonId or collaborator assignments of existing tasks.
          return { people: updatedPeople };
        });
      },

      updateSettings: (updates) => {
        set((state) => {
          const newSettings = { ...state.settings, ...updates };
          if (updates.theme) {
            const isDark =
              updates.theme === 'dark' ||
              (updates.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
          }
          return { settings: newSettings };
        });
      },

      completeOnboarding: (projectName, teamName, names, connectSheetNow) => {
        const now = new Date().toISOString();
        set((state) => {
          const updatedPeople = state.people.map((p) => {
            if (p.isPrimary && names[p.roleId]) {
              const fullName = names[p.roleId].trim();
              const parts = fullName.split(' ');
              const shortName = parts[parts.length - 1] || fullName;
              return {
                ...p,
                fullName,
                shortName,
                updatedAt: now,
              };
            }
            return p;
          });

          return {
            people: updatedPeople,
            settings: {
              ...state.settings,
              projectName,
              teamName,
              onboardingCompleted: true,
            },
            activeTab: connectSheetNow ? 'sheets' : 'overview',
          };
        });
      },

      resetToSeedData: () => {
        set({
          roles: INITIAL_ROLES,
          people: INITIAL_PEOPLE,
          tasks: INITIAL_TASKS,
          taskLinks: INITIAL_TASK_LINKS,
          settings: INITIAL_SETTINGS,
          selectedTaskId: null,
          selectedRoleId: null,
          perspectivePersonId: null,
          selectedRowIds: [],
        });
      },

      importData: (importedData) => {
        set((state) => ({
          roles: importedData.roles || state.roles,
          people: importedData.people || state.people,
          tasks: importedData.tasks || state.tasks,
          taskLinks: importedData.taskLinks || state.taskLinks,
          settings: importedData.settings ? { ...state.settings, ...importedData.settings } : state.settings,
        }));
      },

      updateSyncState: (updates) => {
        set((state) => ({
          syncState: { ...state.syncState, ...updates },
        }));
      },

      addSyncLog: (status, message) => {
        const id = `log-${Date.now().toString(36)}`;
        const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        set((state) => ({
          syncState: {
            ...state.syncState,
            syncLogs: [{ id, timestamp, status, message }, ...state.syncState.syncLogs.slice(0, 49)],
          },
        }));
      },
    }),
    {
      name: 'dbc-task-system-2026',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        let state = persistedState;
        // Migration from V1 (or unversioned) to V2
        if (version < 2 && state) {
          const rawTasks: any[] = state.tasks || [];
          const rawPeople: Person[] = state.people || INITIAL_PEOPLE;

          // Helper to find primary person of a role
          const getPrimaryPersonId = (roleId: RoleId): string => {
            const p = rawPeople.find((person) => person.roleId === roleId && person.isPrimary);
            return p ? p.id : `p-${roleId}`;
          };

          // Filter out the 82 old seed tasks
          // Keep only user-created custom tasks (whose IDs are NOT in OLD_82_SEED_IDS and NOT in INITIAL_TASKS)
          const customTasks = rawTasks
            .filter((t) => !OLD_82_SEED_IDS.has(t.id) && !t.id.startsWith('CORE-'))
            .map((t) => {
              const ownerRoleId = t.ownerRoleId || 1;
              const ownerPersonId = t.ownerPersonId || getPrimaryPersonId(ownerRoleId);

              // Map collaborators
              const collabs: TaskCollaborator[] = [];
              if (Array.isArray(t.collaboratorRoleIds)) {
                t.collaboratorRoleIds.forEach((cRoleId: RoleId) => {
                  const cPersonId = getPrimaryPersonId(cRoleId);
                  const resp = t.responsibilitiesByRole ? t.responsibilitiesByRole[cRoleId] : undefined;
                  collabs.push({ personId: cPersonId, roleId: cRoleId, responsibility: resp });
                });
              } else if (Array.isArray(t.collaborators)) {
                collabs.push(...t.collaborators);
              }

              return {
                id: t.id,
                title: t.title,
                category: t.category || 'Khác',
                ownerPersonId,
                ownerRoleId,
                collaborators: collabs,
                approverPersonId: t.approverRoleId ? getPrimaryPersonId(t.approverRoleId) : undefined,
                approverRoleId: t.approverRoleId,
                status: t.status || 'NOT_STARTED',
                priority: t.priority || 'MEDIUM',
                dueAt: t.dueAt || t.dueDate || null,
                output: t.output || (Array.isArray(t.outputs) ? t.outputs.join(', ') : '') || 'Chưa xác định',
                note: t.note || t.notes || undefined,
                customPosition: t.customPosition,
                createdAt: t.createdAt || new Date().toISOString(),
                updatedAt: t.updatedAt || new Date().toISOString(),
              } as Task;
            });

          // Active tasks are INITIAL_TASKS (Core Tasks) + any preserved custom tasks
          const migratedTasks: Task[] = [...INITIAL_TASKS, ...customTasks];

          state = {
            ...state,
            tasks: migratedTasks,
            taskLinks: INITIAL_TASK_LINKS,
            checklists: undefined,
          };
        }

        // Migration to V3: ensure CORE-21..23 are present
        if (version < 3 && state) {
          const currentTasks: Task[] = state.tasks || [];
          const existingIds = new Set(currentTasks.map((t) => t.id));
          const missingCoreTasks = INITIAL_TASKS.filter((t) => !existingIds.has(t.id));
          state = {
            ...state,
            tasks: [...currentTasks, ...missingCoreTasks],
          };
        }

        return state;
      },
      partialize: (state) => ({
        roles: state.roles,
        people: state.people,
        tasks: state.tasks,
        taskLinks: state.taskLinks,
        settings: state.settings,
        syncState: state.syncState,
        perspectivePersonId: state.perspectivePersonId,
        drawerWidth: state.drawerWidth,
        isDrawerMinimized: state.isDrawerMinimized,
      }),
    }
  )
);
