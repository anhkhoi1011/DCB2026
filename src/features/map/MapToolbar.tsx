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
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useAppStore } from '../../store/useAppStore';

export const MapToolbar: React.FC<{ isFullscreen: boolean; onToggleFullscreen: () => void }> = ({
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const {
    settings,
    updateSettings,
    resetLayout,
    selectedTaskId,
    selectedRoleId,
    clearSelection,
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

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-md select-none text-xs">
      {/* Zoom In & Out */}
      <button
        onClick={() => zoomIn()}
        title="Phóng to"
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut()}
        title="Thu nhỏ"
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Fit All */}
      <button
        onClick={handleFitAll}
        title="Xem toàn bộ sơ đồ"
        className="px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        Xem toàn cảnh
      </button>

      {/* Fit Selected */}
      {(selectedTaskId || selectedRoleId) && (
        <button
          onClick={handleFitSelected}
          title="Tập trung vào mục đang chọn"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition"
        >
          <Target className="w-3.5 h-3.5" />
          <span>Tiêu điểm</span>
        </button>
      )}

      {/* Auto Layout */}
      <button
        onClick={resetLayout}
        title="Tự động sắp xếp lại các công việc về đúng khu vực vai trò"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Tự sắp xếp lại</span>
      </button>

      {/* Lock Layout */}
      <button
        onClick={() => updateSettings({ isLockedLayout: !settings.isLockedLayout })}
        title={settings.isLockedLayout ? 'Đang khóa vị trí (không thể kéo thả)' : 'Đang cho phép kéo thả tự do'}
        className={`p-1.5 rounded-lg transition ${
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
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition ${
          settings.showDependenciesOnTrace
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <GitBranch className="w-3.5 h-3.5" />
        <span>Công việc trước / sau</span>
      </button>

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-0.5"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Clear selection button */}
      {(selectedTaskId || selectedRoleId) && (
        <button
          onClick={clearSelection}
          title="Xóa lựa chọn (Phím ESC)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition ml-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Xóa lựa chọn</span>
        </button>
      )}
    </div>
  );
};
