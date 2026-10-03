import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
  Plus,
  ArrowRight,
  ArrowLeft,
  FileText,
  CheckSquare,
  HelpCircle,
  ListTodo,
} from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { RoleBadge, StatusBadge, PriorityBadge } from '../common/Badges';
import { RoleId, TaskStatus } from '../../types';

export const TaskDrawer: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    roles,
    people,
    checklists,
    taskLinks,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    updateTask,
    deleteTask,
    duplicateTask,
    openTaskForm,
  } = useAppStore();

  const [newChecklistText, setNewChecklistText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const taskChecklists = checklists.filter((c) => c.taskId === task.id);
  const progress = getTaskProgress(task, checklists);

  // Predecessors (Tasks that must finish before this task)
  const incomingLinks = taskLinks.filter((l) => l.targetTaskId === task.id);
  const predecessors = incomingLinks
    .map((l) => {
      const predTask = tasks.find((t) => t.id === l.sourceTaskId);
      return { link: l, task: predTask };
    })
    .filter((item) => item.task !== undefined);

  // Successors (Tasks waiting for this task)
  const outgoingLinks = taskLinks.filter((l) => l.sourceTaskId === task.id);
  const successors = outgoingLinks
    .map((l) => {
      const succTask = tasks.find((t) => t.id === l.targetTaskId);
      return { link: l, task: succTask };
    })
    .filter((item) => item.task !== undefined);

  // Who is blocking this task?
  const blockingPredecessors = predecessors.filter((p) => p.task && p.task.status !== 'DONE');

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(task.id, newChecklistText.trim(), task.ownerRoleId);
    setNewChecklistText('');
  };

  const handleToggleStatus = () => {
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    updateTask(task.id, { status: nextStatus });
  };

  const handleSaveNotes = () => {
    updateTask(task.id, { notes: notesValue });
    setEditingNotes(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col animate-slide-left overflow-hidden">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
            {task.id}
          </span>
          <span className="text-xs text-slate-500 font-medium">{task.category}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openTaskForm(task.id)}
            title="Chỉnh sửa công việc"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => duplicateTask(task.id)}
            title="Nhân bản công việc"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Xóa công việc"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedTaskId(null)}
            title="Đóng chi tiết"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Box */}
      {showDeleteConfirm && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-800 text-xs flex items-center justify-between">
          <div className="text-rose-800 dark:text-rose-200 font-medium">
            Xác nhận xóa công việc <strong>{task.id}</strong>?
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                deleteTask(task.id);
                setShowDeleteConfirm(false);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs"
            >
              Xóa
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded text-xs"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Title & Status Bar */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {task.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Tiến độ hoàn thành
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* PHÂN CÔNG (Responsibility Section) */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Phân công vai trò
          </div>

          {/* Cầm chính */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Cầm chính:
            </span>
            <RoleBadge roleId={task.ownerRoleId} relationship="owner" />
          </div>

          {/* Phối hợp */}
          {task.collaboratorRoleIds && task.collaboratorRoleIds.length > 0 && (
            <div className="flex items-start justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Phối hợp:
              </span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {task.collaboratorRoleIds.map((cRole) => (
                  <RoleBadge key={cRole} roleId={cRole} relationship="collaborator" />
                ))}
              </div>
            </div>
          )}

          {/* Người chốt */}
          {task.approverRoleId && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Người chốt:
              </span>
              <RoleBadge roleId={task.approverRoleId} relationship="approver" />
            </div>
          )}
        </div>

        {/* AI LÀM GÌ TRONG TASK NÀY? (Breakdown) */}
        {task.responsibilitiesByRole && Object.keys(task.responsibilitiesByRole).length > 0 && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ai làm gì trong task này?
            </div>
            <div className="space-y-2">
              {Object.entries(task.responsibilitiesByRole).map(([rIdStr, detail]) => {
                const rId = Number(rIdStr) as RoleId;
                const role = roles.find((r) => r.id === rId);
                const person = people.find((p) => p.roleId === rId && p.isPrimary);
                if (!detail) return null;
                return (
                  <div
                    key={rId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <RoleBadge roleId={rId} size="sm" />
                      <span className="text-slate-800 dark:text-slate-200">
                        {person?.fullName}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
                      {detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ĐẦU VÀO & ĐẦU RA */}
        {((task.inputs && task.inputs.length > 0) || (task.outputs && task.outputs.length > 0)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {task.inputs && task.inputs.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-xs">
                <div className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mb-1.5">
                  Đầu vào
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  {task.inputs.map((inp, idx) => (
                    <li key={idx}>{inp}</li>
                  ))}
                </ul>
              </div>
            )}
            {task.outputs && task.outputs.length > 0 && (
              <div className="p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] mb-1.5">
                  Kết quả đầu ra
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  {task.outputs.map((out, idx) => (
                    <li key={idx}>{out}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* HƯỚNG DẪN THỰC HIỆN & DEFINITION OF DONE */}
        {task.howTo && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hướng dẫn thực hiện
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {task.howTo}
            </p>
          </div>
        )}

        {task.definitionOfDone && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tiêu chuẩn hoàn thành (DoD)
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {task.definitionOfDone}
            </p>
          </div>
        )}

        {/* CHECKLIST */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Checklist ({taskChecklists.filter((c) => c.completed).length}/{taskChecklists.length})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {taskChecklists.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className={item.completed ? 'line-through text-slate-400' : ''}>
                    {item.text}
                  </span>
                </label>
                <button
                  onClick={() => deleteChecklistItem(item.id)}
                  title="Xóa mục"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Checklist Item input */}
          <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="+ Thêm mục kiểm tra..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newChecklistText.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Thêm
            </button>
          </form>
        </div>

        {/* DEPENDENCY & BLOCKERS (Đang chờ ai / Ai đang chờ tôi) */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quan hệ liên kết &amp; Bàn giao
          </div>

          {/* Đang chờ ai? */}
          {blockingPredecessors.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1.5">
              <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Đang chờ hoàn thành trước:</span>
              </div>
              <div className="space-y-1">
                {blockingPredecessors.map((p) => (
                  <div
                    key={p.task!.id}
                    onClick={() => setSelectedTaskId(p.task!.id)}
                    className="flex items-center justify-between p-1.5 bg-white/70 dark:bg-slate-900/60 rounded cursor-pointer hover:bg-white transition"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      [{p.task!.id}] {p.task!.title}
                    </span>
                    <RoleBadge roleId={p.task!.ownerRoleId} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks sau (Successors) */}
          {successors.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1.5">
              <div className="font-semibold text-slate-600 dark:text-slate-400">
                Các công việc nhận kết quả sau task này:
              </div>
              <div className="space-y-1">
                {successors.map((s) => (
                  <div
                    key={s.task!.id}
                    onClick={() => setSelectedTaskId(s.task!.id)}
                    className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      [{s.task!.id}] {s.task!.title}
                    </span>
                    <RoleBadge roleId={s.task!.ownerRoleId} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GHI CHÚ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Ghi chú công việc</span>
            {!editingNotes && (
              <button
                onClick={() => {
                  setNotesValue(task.notes || '');
                  setEditingNotes(true);
                }}
                className="text-blue-600 hover:text-blue-700 text-xs lowercase font-normal"
              >
                sửa
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Nhập ghi chú hoặc biên bản trao đổi..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingNotes(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[40px]">
              {task.notes || <span className="italic text-slate-400">Chưa có ghi chú</span>}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Sticky Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
        <button
          onClick={handleToggleStatus}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold shadow-sm transition ${
            task.status === 'DONE'
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{task.status === 'DONE' ? 'Mở lại (Đang làm)' : 'Đánh dấu hoàn thành'}</span>
        </button>
      </div>
    </div>
  );
};
