import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Sun,
  Moon,
  Laptop,
  Check,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useResolvedTheme, ThemeMode } from '../../hooks/useResolvedTheme';

export const Topbar: React.FC = () => {
  const {
    settings,
    roles,
    people,
    perspectivePersonId,
    setPerspectivePersonId,
    searchQuery,
    setSearchQuery,
    openTaskForm,
    syncState,
    setActiveTab,
  } = useAppStore();

  const { theme, resolvedTheme, setTheme } = useResolvedTheme();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as HTMLElement)) {
        setThemeMenuOpen(false);
      }
    };
    if (themeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [themeMenuOpen]);

  const primaryMembers = roles.map((role) => {
    const person = people.find((p) => p.roleId === role.id && p.isPrimary);
    return {
      role,
      person,
    };
  });

  const themeOptions: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: 'Sáng (Light)', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { mode: 'dark', label: 'Tối (Dark)', icon: <Moon className="w-4 h-4 text-blue-400" /> },
    { mode: 'system', label: 'Hệ thống (System)', icon: <Laptop className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <header className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Left: Project title & Perspective Selector */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            DBC
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {settings.projectName}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {settings.teamName}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Perspective Member Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden lg:inline">
            Đang xem với tư cách:
          </span>
          <div className="relative">
            <select
              value={perspectivePersonId || ''}
              onChange={(e) => setPerspectivePersonId(e.target.value ? e.target.value : null)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả thành viên</option>
              {primaryMembers.map(({ role, person }) => (
                <option key={role.id} value={person?.id || ''}>
                  {role.id === 1 ? '🔵' : role.id === 2 ? '🟣' : role.id === 3 ? '🟢' : '🟠'}{' '}
                  {person?.fullName || 'Chưa gán'} ({role.name})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm công việc, mã ID, từ khóa, vai trò..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Google Sheet Quick Status Button */}
        <button
          onClick={() => setActiveTab('sheets')}
          title={
            syncState.isConnected
              ? `Google Sheets: Đã kết nối. Lần cuối: ${syncState.lastSyncTime || 'vừa xong'}`
              : 'Google Sheets: Chưa kết nối (Đang chạy Local Mode)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            syncState.isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {syncState.isConnected ? 'Đã kết nối Sheet' : 'Local Mode'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              syncState.isConnected ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </button>

        {/* Theme Dropdown Toggle */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            title={`Chế độ giao diện: ${
              theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Theo hệ thống'
            }`}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
          >
            {theme === 'system' ? (
              <Laptop className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                Chế độ giao diện
              </div>
              {themeOptions.map((opt) => {
                const isActive = theme === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    onClick={() => {
                      setTheme(opt.mode);
                      setThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Task Primary Button */}
        <button
          onClick={() => openTaskForm()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công việc</span>
        </button>
      </div>
    </header>
  );
};
