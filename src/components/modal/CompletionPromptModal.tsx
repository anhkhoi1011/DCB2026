import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const CompletionPromptModal: React.FC = () => {
  const { completionPromptTaskId, setCompletionPromptTaskId, tasks, updateTask } = useAppStore();

  if (!completionPromptTaskId) return null;

  const task = tasks.find((t) => t.id === completionPromptTaskId);
  if (!task) return null;

  const handleConfirm = () => {
    updateTask(task.id, { status: 'DONE' });
    setCompletionPromptTaskId(null);
  };

  const handleDismiss = () => {
    setCompletionPromptTaskId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          Hoàn thành toàn bộ Checklist!
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Tất cả các mục kiểm tra của công việc <strong>[{task.id}] {task.title}</strong> đã được đánh dấu xong. Bạn có muốn đổi trạng thái công việc sang <strong>Hoàn thành (DONE)</strong> luôn không?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg transition"
          >
            Để sau
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Đánh dấu DONE
          </button>
        </div>
      </div>
    </div>
  );
};
