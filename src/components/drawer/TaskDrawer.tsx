import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
  ArrowRight,
  ArrowLeft,
  FileText,
  User,
  ShieldCheck,
  Users,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId, TaskStatus, TaskPriority } from '../../types';

export const TaskDrawer: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    people,
    taskLinks,
    updateTask,
    deleteTask,
    openTaskForm,
    isDrawerMinimized,
    drawerWidth,
    setDrawerMinimized,
    setDrawerWidth,
  } = useAppStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const isResizingRef = useRef(false);

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = drawerWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(520, Math.max(280, startWidth + delta));
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Predecessors & Successors
  const incomingLinks = taskLinks.filter((l) => l.targetTaskId === task.id);
  const predecessors = incomingLinks
    .map((l) => {
      const predTask = tasks.find((t) => t.id === l.sourceTaskId);
      return { link: l, task: predTask };
    })
    .filter((item) => item.task !== undefined);

  const outgoingLinks = taskLinks.filter((l) => l.sourceTaskId === task.id);
  const successors = outgoingLinks
    .map((l) => {
      const succTask = tasks.find((t) => t.id === l.targetTaskId);
      return { link: l, task: succTask };
    })
    .filter((item) => item.task !== undefined);

  const ownerPerson =
    people.find((p) => p.id === task.ownerPersonId) ||
    people.find((p) => p.roleId === task.ownerRoleId && p.isPrimary);

  const approverPerson = task.approverPersonId
    ? people.find((p) => p.id === task.approverPersonId)
    : task.approverRoleId
    ? people.find((p) => p.roleId === task.approverRoleId && p.isPrimary)
    : undefined;

  const handleSaveNote = () => {
    updateTask(task.id, { note: noteValue });
    setEditingNote(false);
  };

  const getRoleBadge = (roleId: RoleId) => {
    switch (roleId) {
      case 1:
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-600', name: 'R1 Điều phối' };
      case 2:
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', dot: 'bg-purple-600', name: 'R2 Thị trường' };
      case 3:
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-600', name: 'R3 Gian hàng' };
      case 4:
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-600', name: 'R4 Marketing' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-500', name: `R${roleId}` };
    }
  };

  const statusConfigs: Record<TaskStatus, { text: string; bg: string; textClass: string }> = {
    NOT_STARTED: {
      text: 'Chưa làm',
      bg: 'bg-slate-100 dark:bg-slate-800',
      textClass: 'text-slate-600 dark:text-slate-400',
    },
    IN_PROGRESS: {
      text: 'Đang làm',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      textClass: 'text-amber-700 dark:text-amber-300',
    },
    DONE: {
      text: 'Hoàn thành',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-700 dark:text-emerald-300',
    },
    BLOCKED: {
      text: 'Bị vướng',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      textClass: 'text-rose-700 dark:text-rose-300',
    },
    ON_HOLD: {
      text: 'Tạm dừng',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      textClass: 'text-zinc-600 dark:text-zinc-400',
    },
  };

  const priorityConfigs: Record<TaskPriority, { text: string; badge: string }> = {
    LOW: { text: 'Thấp', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    MEDIUM: { text: 'Vừa', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    HIGH: { text: 'Cao', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    URGENT: { text: 'Khẩn cấp', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  };

  const isOverdue =
    Boolean(task.dueAt) &&
    task.status !== 'DONE' &&
    new Date(task.dueAt!).getTime() < new Date().setHours(0, 0, 0, 0);

  const ownerBadge = getRoleBadge(task.ownerRoleId);

  if (isDrawerMinimized) {
    return (
      <div className="w-[46px] min-w-[46px] max-w-[46px] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between items-center py-3 select-none z-20 shrink-0 shadow-lg">
        {/* Restore button */}
        <button
          onClick={() => setDrawerMinimized(false)}
          title="Mở rộng chi tiết công việc"
          className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>

        {/* Vertical info */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 overflow-hidden py-4">
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {task.id}
          </span>
          <div
            className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-h-56 truncate tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {task.title}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setSelectedTaskId(null)}
          title="Đóng chi tiết"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer mb-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ width: `${drawerWidth}px`, minWidth: 280, maxWidth: 520 }}
      className="h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20 flex flex-col relative shrink-0 overflow-hidden"
    >
      {/* Draggable resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 transition-colors z-30 group flex items-center justify-center select-none"
        title="Kéo sang trái/phải để thay đổi độ rộng bảng chi tiết (280px - 520px)"
      >
        <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 rounded-full" />
      </div>

      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
            {task.id}
          </span>
          {task.category && (
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {task.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDrawerMinimized(true)}
            title="Thu gọn bảng chi tiết"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
          <button
            onClick={() => openTaskForm(task.id)}
            title="Chỉnh sửa công việc"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Xóa công việc"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedTaskId(null)}
            title="Đóng chi tiết"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1 cursor-pointer"
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
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs cursor-pointer"
            >
              Xóa
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded text-xs cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {task.title}
          </h2>
        </div>

        {/* Status, Priority, Due Date Grid */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          {/* Status */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Trạng thái</div>
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
              className={`font-semibold text-xs px-2 py-1 rounded-lg border-0 cursor-pointer ${statusConfigs[task.status].bg} ${statusConfigs[task.status].textClass}`}
            >
              <option value="NOT_STARTED">Chưa làm</option>
              <option value="IN_PROGRESS">Đang làm</option>
              <option value="DONE">Hoàn thành</option>
              <option value="BLOCKED">Bị vướng</option>
              <option value="ON_HOLD">Tạm dừng</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ưu tiên</div>
            {task.priority ? (
              <span
                className={`inline-block font-semibold text-xs px-2 py-1 rounded-lg ${priorityConfigs[task.priority].badge}`}
              >
                {priorityConfigs[task.priority].text}
              </span>
            ) : (
              <span className="text-slate-400 text-xs">—</span>
            )}
          </div>

          {/* Due Date */}
          <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Hạn hoàn thành:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={task.dueAt || ''}
                onChange={(e) => updateTask(task.id, { dueAt: e.target.value || null })}
                className={`text-xs bg-transparent border-0 font-medium cursor-pointer ${
                  isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              />
              {isOverdue && (
                <span
                  title="Quá hạn"
                  className="inline-flex items-center text-rose-500 text-[10px] font-bold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Roles & People Section */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Phân Công Trách Nhiệm</span>
          </div>

          {/* Owner (Cầm chính) */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Cầm chính (Chịu trách nhiệm chính)</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${ownerBadge.dot}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {ownerPerson ? ownerPerson.fullName : `Vai trò 0${task.ownerRoleId}`}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${ownerBadge.bg}`}>
                {ownerBadge.name}
              </span>
            </div>
          </div>

          {/* Collaborators (Phối hợp) */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Phối hợp thực hiện</div>
            {(task.collaborators || []).length > 0 ? (
              <div className="space-y-2">
                {task.collaborators.map((c, idx) => {
                  const person = people.find((p) => p.id === c.personId);
                  const badge = getRoleBadge(c.roleId);
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {person ? person.fullName : `Người phụ trách R${c.roleId}`}
                          </span>
                        </div>
                        {c.responsibility && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ml-3.5 leading-tight">
                            Phần việc: {c.responsibility}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${badge.bg}`}>
                        0{c.roleId}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Việc riêng, không có người phối hợp.</p>
            )}
          </div>

          {/* Approver (Người chốt) */}
          {approverPerson && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Người chốt kết quả</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {approverPerson.fullName}
                </div>
              </div>
              {task.approverRoleId && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  Duyệt chốt (R{task.approverRoleId})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Output cần bàn giao */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Output Cần Bàn Giao</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {task.output || <span className="text-slate-400 italic">Chưa xác định output cụ thể.</span>}
          </div>
        </div>

        {/* Task liên quan (Dependencies & Handoffs) */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Task Liên Quan ({predecessors.length + successors.length})
          </div>

          {predecessors.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-amber-500" />
                <span>Cần hoàn thành trước task này:</span>
              </div>
              <div className="space-y-1">
                {predecessors.map(({ link, task: pred }) => (
                  <div
                    key={link.id}
                    onClick={() => pred && setSelectedTaskId(pred.id)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-400 cursor-pointer text-xs flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {pred?.id}
                      </span>
                      <span className="line-clamp-1 text-slate-700 dark:text-slate-300 font-medium">
                        {pred?.title}
                      </span>
                    </div>
                    {link.label && (
                      <span className="text-[10px] text-slate-400 italic shrink-0">
                        {link.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {successors.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-500" />
                <span>Bàn giao tiếp theo cho:</span>
              </div>
              <div className="space-y-1">
                {successors.map(({ link, task: succ }) => (
                  <div
                    key={link.id}
                    onClick={() => succ && setSelectedTaskId(succ.id)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-400 cursor-pointer text-xs flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1 bg-slate-100 dark:bg-slate-700 rounded">
                        {succ?.id}
                      </span>
                      <span className="line-clamp-1 text-slate-700 dark:text-slate-300 font-medium">
                        {succ?.title}
                      </span>
                    </div>
                    {link.label && (
                      <span className="text-[10px] text-slate-400 italic shrink-0">
                        {link.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {predecessors.length === 0 && successors.length === 0 && (
            <p className="text-xs text-slate-400 italic p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
              Không có phụ thuộc liên kết nào.
            </p>
          )}
        </div>

        {/* Ghi chú */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ghi Chú</div>
            {!editingNote && (
              <button
                type="button"
                onClick={() => {
                  setNoteValue(task.note || '');
                  setEditingNote(true);
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {task.note ? 'Sửa' : '+ Thêm ghi chú'}
              </button>
            )}
          </div>

          {editingNote ? (
            <div className="space-y-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Nhập ghi chú cho công việc..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                >
                  Lưu ghi chú
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
              {task.note ? (
                <p className="whitespace-pre-line leading-relaxed">{task.note}</p>
              ) : (
                <span className="text-slate-400 italic">Chưa có ghi chú nào.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
        <button
          onClick={() => {
            const nextStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
            updateTask(task.id, { status: nextStatus });
          }}
          className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition cursor-pointer ${
            task.status === 'DONE'
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {task.status === 'DONE' ? 'Đánh dấu Chưa xong' : '✓ Đánh dấu Hoàn thành'}
        </button>

        <button
          onClick={() => openTaskForm(task.id)}
          className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
        >
          Sửa chi tiết
        </button>
      </div>
    </div>
  );
};
