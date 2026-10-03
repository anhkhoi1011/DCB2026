import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  UserCheck,
  CheckSquare,
  Users,
  TableProperties,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore, NavigationTab } from '../../store/useAppStore';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'map', label: 'Bản đồ công việc', icon: GitFork },
  { id: 'my-work', label: 'Công việc của tôi', icon: UserCheck },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'members', label: 'Thành viên', icon: Users },
  { id: 'tasks', label: 'Danh sách Task', icon: TableProperties },
  { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-all duration-200 select-none z-10 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation Top Section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-4 px-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Menu Điều hướng
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition mx-auto"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Role Legend summary when expanded */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 m-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            4 Role Cốt Lõi
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              <span className="truncate">R1 · Trưởng nhóm</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              <span className="truncate">R2 · Phân tích thị trường</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="truncate">R3 · Quản lý gian hàng</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
              <span className="truncate">R4 · Marketing</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
