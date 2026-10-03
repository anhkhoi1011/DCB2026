import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    roles,
    people,
    tasks,
    checklists,
    taskLinks,
    resetToSeedData,
    importData,
    addSyncLog,
  } = useAppStore();

  const [projectName, setProjectName] = useState(settings.projectName);
  const [teamName, setTeamName] = useState(settings.teamName);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      projectName: projectName.trim(),
      teamName: teamName.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      roles,
      people,
      tasks,
      checklists,
      taskLinks,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dbc-2026-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addSyncLog('info', 'Đã xuất file dự phòng JSON thành công.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks && parsed.roles) {
          importData(parsed);
          addSyncLog('success', 'Đã nhập dữ liệu dự phòng từ file JSON thành công!');
        } else {
          alert('File JSON không đúng cấu trúc DBC Task System.');
        }
      } catch (err) {
        alert('Lỗi định dạng file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>Cài Đặt Hệ Thống &amp; Sao Lưu Dữ Liệu</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý thông tin đội thi, giao diện và sao lưu phục hồi dữ liệu
        </p>
      </div>

      {/* General Settings */}
      <form
        onSubmit={handleSaveGeneral}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Thông tin Cuộc thi &amp; Nhóm
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên cuộc thi / Dự án:
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên nhóm thi:
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã lưu thành công!</span>
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>

      {/* Theme Selection */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Chế độ giao diện (Theme)
        </h3>
        <p className="text-xs text-slate-500">
          Tùy chỉnh tông màu hiển thị theo sở thích hoặc theo cài đặt hệ điều hành
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              settings.theme === 'light'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Sáng (Light)</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              settings.theme === 'dark'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Tối (Dark)</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ theme: 'system' })}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
              settings.theme === 'system'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Hệ thống (System)</span>
          </button>
        </div>
      </div>

      {/* JSON Backup & Restore */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Sao Lưu &amp; Khôi Phục File JSON
        </h3>
        <p className="text-xs text-slate-500">
          Xuất toàn bộ cơ sở dữ liệu nội bộ (vai trò, thành viên, công việc, checklist, liên kết) để lưu trữ an toàn hoặc chuyển máy
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file JSON sao lưu</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Nhập dữ liệu từ file JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset Seed Data */}
      <div className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Khôi Phục Dữ Liệu Mẫu Ban Đầu</span>
        </h3>
        <p className="text-xs text-rose-700/80 dark:text-rose-400">
          Tùy chọn này sẽ đặt lại toàn bộ hệ thống về bộ 58 công việc mẫu tiêu chuẩn DBC 2026 và 4 thành viên ban đầu.
        </p>

        {showResetConfirm ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                resetToSeedData();
                setShowResetConfirm(false);
                addSyncLog('info', 'Đã khôi phục toàn bộ dữ liệu mẫu ban đầu.');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Chắc chắn khôi phục
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded-xl transition"
          >
            Khôi phục dữ liệu mẫu DBC 2026
          </button>
        )}
      </div>
    </div>
  );
};
