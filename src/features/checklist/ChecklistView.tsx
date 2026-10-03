import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Layers,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { RoleBadge } from '../../components/common/Badges';
import { RoleId, ChecklistItem } from '../../types';

type GroupMode = 'PERSON' | 'TASK' | 'DEADLINE' | 'STATUS';

export const ChecklistView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
    checklists,
    toggleChecklistItem,
    deleteChecklistItem,
    addChecklistItem,
    setSelectedTaskId,
  } = useAppStore();

  const [groupMode, setGroupMode] = useState<GroupMode>('PERSON');
  const [newTaskSelect, setNewTaskSelect] = useState<string>(tasks[0]?.id || '');
  const [newText, setNewText] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newTaskSelect) return;
    const task = tasks.find((t) => t.id === newTaskSelect);
    addChecklistItem(newTaskSelect, newText.trim(), task?.ownerRoleId);
    setNewText('');
  };

  const renderChecklistRow = (item: ChecklistItem) => {
    const parentTask = tasks.find((t) => t.id === item.taskId);
    const assigneeRoleId = item.assigneeRoleId || parentTask?.ownerRoleId || 1;

    return (
      <div
        key={item.id}
        className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => toggleChecklistItem(item.id)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div
              className={`text-xs font-medium cursor-pointer transition ${
                item.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
              onClick={() => toggleChecklistItem(item.id)}
            >
              {item.text}
            </div>
            {parentTask && (
              <div
                onClick={() => setSelectedTaskId(parentTask.id)}
                className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer truncate mt-0.5"
              >
                [{parentTask.id}] {parentTask.title}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <RoleBadge roleId={assigneeRoleId} size="sm" />
          <button
            onClick={() => deleteChecklistItem(item.id)}
            title="Xóa mục"
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Grouping logic
  const renderGroupedContent = () => {
    if (groupMode === 'PERSON') {
      return (
        <div className="space-y-6">
          {roles.map((role) => {
            const person = people.find((p) => p.roleId === role.id && p.isPrimary);
            // Items assigned to this role or child of tasks owned by this role
            const roleItems = checklists.filter((c) => {
              if (c.assigneeRoleId === role.id) return true;
              const t = tasks.find((item) => item.id === c.taskId);
              return t?.ownerRoleId === role.id;
            });

            const doneCount = roleItems.filter((c) => c.completed).length;

            return (
              <div key={role.id} className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <RoleBadge roleId={role.id} />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {person?.fullName || 'Chưa gán'}
                    </span>
                    <span className="text-xs text-slate-400">({role.name})</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {doneCount}/{roleItems.length} Xong
                  </span>
                </div>

                <div className="space-y-2">
                  {roleItems.map(renderChecklistRow)}
                  {roleItems.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-2">
                      Chưa có mục checklist nào cho vai trò này.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (groupMode === 'TASK') {
      return (
        <div className="space-y-6">
          {tasks
            .filter((t) => checklists.some((c) => c.taskId === t.id))
            .map((task) => {
              const taskItems = checklists.filter((c) => c.taskId === task.id);
              const progress = getTaskProgress(task, checklists);

              return (
                <div key={task.id} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                    <div
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition"
                    >
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {task.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge roleId={task.ownerRoleId} size="sm" />
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">{taskItems.map(renderChecklistRow)}</div>
                </div>
              );
            })}
        </div>
      );
    }

    if (groupMode === 'STATUS') {
      const pendingItems = checklists.filter((c) => !c.completed);
      const doneItems = checklists.filter((c) => c.completed);

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Cần thực hiện ({pendingItems.length})</span>
              </span>
            </div>
            <div className="space-y-2">{pendingItems.map(renderChecklistRow)}</div>
          </div>

          {/* Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã hoàn thành ({doneItems.length})</span>
              </span>
            </div>
            <div className="space-y-2">{doneItems.map(renderChecklistRow)}</div>
          </div>
        </div>
      );
    }

    // Default / DEADLINE mode
    return (
      <div className="space-y-4">
        {checklists.map(renderChecklistRow)}
      </div>
    );
  };

  const totalChecklists = checklists.length;
  const totalCompleted = checklists.filter((c) => c.completed).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>Danh Sách Kiểm Tra (Checklist)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tích chọn trực tiếp để cập nhật tiến độ công việc tức thời
          </p>
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setGroupMode('PERSON')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              groupMode === 'PERSON'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Theo Người
          </button>
          <button
            onClick={() => setGroupMode('TASK')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              groupMode === 'TASK'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Theo Công việc
          </button>
          <button
            onClick={() => setGroupMode('STATUS')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              groupMode === 'STATUS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Theo Trạng thái
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAdd}
        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3"
      >
        <select
          value={newTaskSelect}
          onChange={(e) => setNewTaskSelect(e.target.value)}
          className="sm:w-64 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.id}] {t.title}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Nội dung mục cần kiểm tra..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={!newText.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục</span>
        </button>
      </form>

      {/* Progress Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Đã xong: <strong>{totalCompleted}</strong> / {totalChecklists} mục kiểm tra
        </span>
        <span className="font-mono font-bold text-blue-600">
          {totalChecklists > 0 ? Math.round((totalCompleted / totalChecklists) * 100) : 0}%
        </span>
      </div>

      {/* Grouped Checklists Content */}
      <div className="space-y-6">{renderGroupedContent()}</div>
    </div>
  );
};
