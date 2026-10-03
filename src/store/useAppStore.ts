import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Role,
  Person,
  Task,
  ChecklistItem,
  TaskLink,
  AppSettings,
  SyncState,
  RoleId,
  TaskStatus,
  TaskPriority,
} from '../types';
import {
  INITIAL_ROLES,
  INITIAL_PEOPLE,
  INITIAL_TASKS,
  INITIAL_CHECKLISTS,
  INITIAL_TASK_LINKS,
  INITIAL_SETTINGS,
} from '../data/seedData';
import { calculateAutomaticLayout } from '../utils/layout';

export type NavigationTab =
  | 'overview'
  | 'map'
  | 'my-work'
  | 'checklist'
  | 'members'
  | 'tasks'
  | 'sheets'
  | 'settings';

interface AppStoreState {
  roles: Role[];
  people: Person[];
  tasks: Task[];
  checklists: ChecklistItem[];
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
  filterCategory: string | 'ALL';

  // Modal / Drawer controls
  isTaskFormOpen: boolean;
  editingTaskId: string | null;
  completionPromptTaskId: string | null;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  toggleSidebar: () => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedRoleId: (id: RoleId | null) => void;
  clearSelection: () => void;
  setPerspectivePersonId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: TaskStatus | 'ALL') => void;
  setFilterPriority: (priority: TaskPriority | 'ALL') => void;
  setFilterRole: (role: RoleId | 'ALL') => void;
  setFilterCategory: (category: string | 'ALL') => void;

  openTaskForm: (taskId?: string) => void;
  closeTaskForm: () => void;
  setCompletionPromptTaskId: (id: string | null) => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'createdAt' | 'updatedAt' | 'participantRoleIds'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  updateTaskPosition: (id: string, pos: { x: number; y: number }) => void;
  resetLayout: () => void;

  // Checklist Actions
  addChecklistItem: (taskId: string, text: string, assigneeRoleId?: RoleId) => void;
  toggleChecklistItem: (id: string) => void;
  deleteChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, text: string) => void;

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

// Compute task progress from checklists or manual value
export function getTaskProgress(task: Task, checklists: ChecklistItem[]): number {
  const items = checklists.filter((c) => c.taskId === task.id);
  if (items.length > 0) {
    const done = items.filter((c) => c.completed).length;
    return Math.round((done / items.length) * 100);
  }
  if (task.status === 'DONE') return 100;
  return task.manualProgress || 0;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      roles: INITIAL_ROLES,
      people: INITIAL_PEOPLE,
      tasks: INITIAL_TASKS,
      checklists: INITIAL_CHECKLISTS,
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
            message: 'Hệ thống khởi chạy ở chế độ Dữ liệu Nội bộ (Local Mode)',
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
      filterCategory: 'ALL',

      isTaskFormOpen: false,
      editingTaskId: null,
      completionPromptTaskId: null,

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSelectedTaskId: (id) => set({ selectedTaskId: id, selectedRoleId: null }),
      setSelectedRoleId: (id) => set({ selectedRoleId: id, selectedTaskId: null }),
      clearSelection: () => set({ selectedTaskId: null, selectedRoleId: null }),
      setPerspectivePersonId: (id) => {
        set({ perspectivePersonId: id });
        if (id) {
          const person = get().people.find((p) => p.id === id);
          if (person) {
            set({ selectedRoleId: person.roleId, selectedTaskId: null });
          }
        }
      },
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      setFilterRole: (role) => set({ filterRole: role }),
      setFilterCategory: (category) => set({ filterCategory: category }),

      openTaskForm: (taskId) => set({ isTaskFormOpen: true, editingTaskId: taskId || null }),
      closeTaskForm: () => set({ isTaskFormOpen: false, editingTaskId: null }),
      setCompletionPromptTaskId: (id) => set({ completionPromptTaskId: id }),

      addTask: (newTaskData) => {
        const participantRoleIds = Array.from(
          new Set([newTaskData.ownerRoleId, ...(newTaskData.collaboratorRoleIds || [])])
        );
        const now = new Date().toISOString();
        const newTask: Task = {
          ...newTaskData,
          participantRoleIds,
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
        set((state) => {
          const updatedTasks = state.tasks.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, ...updates, updatedAt: now };
            if (updates.ownerRoleId !== undefined || updates.collaboratorRoleIds !== undefined) {
              const owner = updates.ownerRoleId !== undefined ? updates.ownerRoleId : t.ownerRoleId;
              const collabs =
                updates.collaboratorRoleIds !== undefined
                  ? updates.collaboratorRoleIds
                  : t.collaboratorRoleIds;
              updated.participantRoleIds = Array.from(new Set([owner, ...(collabs || [])]));
            }
            return updated;
          });
          return { tasks: updatedTasks };
        });
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          checklists: state.checklists.filter((c) => c.taskId !== id),
          taskLinks: state.taskLinks.filter((l) => l.sourceTaskId !== id && l.targetTaskId !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }));
      },

      duplicateTask: (id) => {
        const state = get();
        const original = state.tasks.find((t) => t.id === id);
        if (!original) return;
        const now = new Date().toISOString();
        const newId = `T-${Date.now().toString(36).toUpperCase()}`;
        const clonedTask: Task = {
          ...original,
          id: newId,
          title: `${original.title} (Bản sao)`,
          createdAt: now,
          updatedAt: now,
          customPosition: original.customPosition
            ? { x: original.customPosition.x + 30, y: original.customPosition.y + 30 }
            : undefined,
        };

        const originalChecklists = state.checklists.filter((c) => c.taskId === id);
        const clonedChecklists = originalChecklists.map((c, i) => ({
          ...c,
          id: `ck-${newId}-${i + 1}`,
          taskId: newId,
          completed: false,
        }));

        set((s) => ({
          tasks: [...s.tasks, clonedTask],
          checklists: [...s.checklists, ...clonedChecklists],
          selectedTaskId: newId,
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

      addChecklistItem: (taskId, text, assigneeRoleId) => {
        const id = `ck-${Date.now().toString(36)}`;
        const state = get();
        const existing = state.checklists.filter((c) => c.taskId === taskId);
        const newItem: ChecklistItem = {
          id,
          taskId,
          text,
          assigneeRoleId,
          completed: false,
          sortOrder: existing.length + 1,
        };
        set((s) => ({
          checklists: [...s.checklists, newItem],
        }));
      },

      toggleChecklistItem: (id) => {
        const state = get();
        let targetTaskId: string | null = null;
        let allCompletedNow = false;

        const updatedChecklists = state.checklists.map((c) => {
          if (c.id === id) {
            targetTaskId = c.taskId;
            return { ...c, completed: !c.completed };
          }
          return c;
        });

        if (targetTaskId) {
          const taskItems = updatedChecklists.filter((c) => c.taskId === targetTaskId);
          allCompletedNow = taskItems.length > 0 && taskItems.every((c) => c.completed);
        }

        set({ checklists: updatedChecklists });

        // If all items completed and task is not yet done, prompt to mark as DONE
        if (targetTaskId && allCompletedNow) {
          const task = state.tasks.find((t) => t.id === targetTaskId);
          if (task && task.status !== 'DONE') {
            set({ completionPromptTaskId: targetTaskId });
          }
        }
      },

      deleteChecklistItem: (id) => {
        set((state) => ({
          checklists: state.checklists.filter((c) => c.id !== id),
        }));
      },

      updateChecklistItem: (id, text) => {
        set((state) => ({
          checklists: state.checklists.map((c) => (c.id === id ? { ...c, text } : c)),
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
        set((state) => ({
          people: state.people.map((p) => {
            if (p.roleId === roleId) {
              return {
                ...p,
                isPrimary: p.id === personId,
                updatedAt: now,
              };
            }
            return p;
          }),
        }));
      },

      updateSettings: (updates) => {
        set((state) => {
          const newSettings = { ...state.settings, ...updates };
          // Apply theme to document
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
          // Update primary person names for the 4 roles
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
          checklists: INITIAL_CHECKLISTS,
          taskLinks: INITIAL_TASK_LINKS,
          settings: INITIAL_SETTINGS,
          selectedTaskId: null,
          selectedRoleId: null,
          perspectivePersonId: null,
        });
      },

      importData: (importedData) => {
        set((state) => ({
          roles: importedData.roles || state.roles,
          people: importedData.people || state.people,
          tasks: importedData.tasks || state.tasks,
          checklists: importedData.checklists || state.checklists,
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        roles: state.roles,
        people: state.people,
        tasks: state.tasks,
        checklists: state.checklists,
        taskLinks: state.taskLinks,
        settings: state.settings,
        syncState: state.syncState,
        perspectivePersonId: state.perspectivePersonId,
      }),
    }
  )
);
