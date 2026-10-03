import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Lock,
  Unlock,
  GitBranch,
  X,
  Target,
  Map as MapIcon,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAppStore } from '../../store/useAppStore';

export const MapToolbar: React.FC<{
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
}> = ({ isFullscreen, onToggleFullscreen, showMiniMap, onToggleMiniMap }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const {
    settings,
    updateSettings,
    resetLayout,
    selectedTaskId,
    selectedRoleId,
    perspectivePersonId,
    clearSelection,
    tasks,
    roles,
    people,
    isDrawerMinimized,
    toggleDrawerMinimized,
  } = useAppStore();

  const handleFitAll = () => {
    fitView({ padding: 0.15, duration: 400 });
  };

  const handleFitSelected = () => {
    if (selectedTaskId) {
      fitView({ nodes: [{ id: `task-${selectedTaskId}` }], duration: 400, maxZoom: 1.2 });
    } else if (selectedRoleId) {
      fitView({ nodes: [{ id: `role-${selectedRoleId}` }], duration: 400, maxZoom: 1.2 });
    } else {
      fitView({ padding: 0.15, duration: 400 });
    }
  };

  // Derive selection context
  // When filter = "Tất cả thành viên" (perspectivePersonId is null), do NOT show any role chip unless explicitly selected
  let activeSelectionLabel = '';
  if (selectedTaskId) {
    const t = tasks.find((item) => item.id === selectedTaskId);
    if (t) activeSelectionLabel = `Công việc: [${t.id}] ${t.title}`;
  } else if (perspectivePersonId) {
    const p = people.find((item) => item.id === perspectivePersonId);
    if (p) activeSelectionLabel = `Thành viên: ${p.fullName} (${p.shortName})`;
  } else if (selectedRoleId) {
    const r = roles.find((item) => item.id === selectedRoleId);
    if (r) activeSelectionLabel = `Vai trò: ${r.name}`;
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[calc(100vw-3rem)] select-none pointer-events-none">
      {/* Row 1: Dedicated Controls Panel */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-md text-xs pointer-events-auto w-fit">
        {/* Zoom In & Out */}
        <button
          onClick={() => zoomIn()}
          title="Phóng to"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomOut()}
          title="Thu nhỏ"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Fit All */}
        <button
          onClick={handleFitAll}
          title="Xem toàn bộ sơ đồ công việc"
          className="px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Xem toàn bộ
        </button>

        {/* Fit Selected */}
        {(selectedTaskId || selectedRoleId) && (
          <button
            onClick={handleFitSelected}
            title="Tập trung vào mục đang chọn"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Tiêu điểm</span>
          </button>
        )}

        {/* Auto Layout */}
        <button
          onClick={resetLayout}
          title="Tự sắp xếp lại các công việc về đúng khu vực vai trò"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tự sắp xếp lại</span>
        </button>

        {/* Lock Layout */}
        <button
          onClick={() => updateSettings({ isLockedLayout: !settings.isLockedLayout })}
          title={settings.isLockedLayout ? 'Đang khóa vị trí (không thể kéo thả)' : 'Đang cho phép kéo thả tự do'}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            settings.isLockedLayout
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {settings.isLockedLayout ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Toggle Dependencies */}
        <button
          onClick={() =>
            updateSettings({ showDependenciesOnTrace: !settings.showDependenciesOnTrace })
          }
          title="Bật/Tắt hiển thị các công việc phụ thuộc trước và sau khi chọn một task"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
            settings.showDependenciesOnTrace
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Công việc trước / sau</span>
        </button>

        {/* MiniMap Toggle */}
        <button
          onClick={onToggleMiniMap}
          title={showMiniMap ? 'Ẩn bản đồ thu nhỏ' : 'Hiện bản đồ thu nhỏ'}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            showMiniMap
              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapIcon className="w-4 h-4" />
        </button>

        {/* Minimize / Restore Drawer toggle (active when a task is open) */}
        {selectedTaskId && (
          <button
            onClick={toggleDrawerMinimized}
            title={isDrawerMinimized ? 'Mở rộng chi tiết công việc' : 'Thu gọn chi tiết công việc'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {isDrawerMinimized ? (
              <PanelRightOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isDrawerMinimized ? 'Mở chi tiết' : 'Thu gọn'}
            </span>
          </button>
        )}

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Row 2: Selected Context Row */}
      {activeSelectionLabel && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 border border-blue-500/50 rounded-full shadow-md backdrop-blur-md text-xs pointer-events-auto w-fit max-w-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {activeSelectionLabel}
          </span>
          <button
            onClick={clearSelection}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
            title="Xóa lựa chọn (Phím ESC)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
