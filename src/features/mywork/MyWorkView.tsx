import React, { useState } from 'react';
import {
  User,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { RoleBadge, StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { RoleId, Task } from '../../types';

export const MyWorkView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
    checklists,
    taskLinks,
    perspectivePersonId,
    setPerspectivePersonId,
    setSelectedTaskId,
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OWNER' | 'COLLAB' | 'APPROVER'>('ALL');

  // Currently viewed person
  const activePerson = people.find((p) => p.id === perspectivePersonId) || people[0];
  const activeRoleId: RoleId = activePerson ? activePerson.roleId : 1;
  const activeRole = roles.find((r) => r.id === activeRoleId);

  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. VIỆC TÔI CẦM CHÍNH
  const ownerTasks = tasks.filter((t) => t.ownerRoleId === activeRoleId);

  // 2. VIỆC TÔI PHỐI HỢP
  const collabTasks = tasks.filter((t) => (t.collaboratorRoleIds || []).includes(activeRoleId));

  // 3. VIỆC TÔI CHỐT
  const approverTasks = tasks.filter((t) => t.approverRoleId === activeRoleId);

  // 4. VIỆC ĐANG CHỜ NGƯỜI KHÁC
  // Tasks where I am owner or collaborator, but incoming dependencies are not DONE
  const waitingOnOthers = [...ownerTasks, ...collabTasks].filter((t) => {
    if (t.status === 'DONE') return false;
    const incoming = taskLinks.filter((l) => l.targetTaskId === t.id);
    return incoming.some((link) => {
      const pred = tasks.find((item) => item.id === link.sourceTaskId);
      return pred && pred.status !== 'DONE' && pred.ownerRoleId !== activeRoleId;
    });
  });

  // 5. NGƯỜI KHÁC ĐANG CHỜ TÔI
  // Tasks where I am owner and NOT DONE, but other tasks depend on me
  const othersWaitingOnMe: { myTask: Task; blockedTask: Task }[] = [];
  ownerTasks
    .filter((t) => t.status !== 'DONE')
    .forEach((myTask) => {
      const outgoing = taskLinks.filter((l) => l.sourceTaskId === myTask.id);
      outgoing.forEach((link) => {
        const succ = tasks.find((item) => item.id === link.targetTaskId);
        if (succ && succ.ownerRoleId !== activeRoleId) {
          othersWaitingOnMe.push({ myTask, blockedTask: succ });
        }
      });
    });

  // 6. QUÁ HẠN
  const overdueTasks = [...ownerTasks, ...collabTasks].filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE'
  );

  // 7. SẮP ĐẾN HẠN
  const dueSoonTasks = [...ownerTasks, ...collabTasks].filter(
    (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= threeDaysLater && t.status !== 'DONE'
  );

  // Filter tasks based on activeFilter tab
  let displayedTasks: Task[] = [];
  if (activeFilter === 'OWNER') {
    displayedTasks = ownerTasks;
  } else if (activeFilter === 'COLLAB') {
    displayedTasks = collabTasks;
  } else if (activeFilter === 'APPROVER') {
    displayedTasks = approverTasks;
  } else {
    // ALL
    displayedTasks = Array.from(new Set([...ownerTasks, ...collabTasks, ...approverTasks]));
  }

  const renderTaskCard = (task: Task, extraContext?: string) => {
    const progress = getTaskProgress(task, checklists);
    const isOwner = task.ownerRoleId === activeRoleId;
    const isApprover = task.approverRoleId === activeRoleId;

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {task.id}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{task.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} size="sm" />
          </div>
        </div>

        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Role & Role in this task */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-[11px]">Cầm chính:</span>
            <RoleBadge roleId={task.ownerRoleId} size="sm" />
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            {isOwner ? '● Cầm chính' : isApprover ? '● Người chốt' : '○ Phối hợp'}
          </span>
        </div>

        {extraContext && (
          <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
            {extraContext}
          </div>
        )}

        {/* Progress & Deadline */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Chưa đặt hạn'}</span>
          </div>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {progress}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Perspective Switching */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
            {activePerson?.shortName ? activePerson.shortName.charAt(0) : <User className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bảng theo dõi cá nhân</div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{activePerson?.fullName || 'Thành viên'}</span>
              <RoleBadge roleId={activeRoleId} />
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang xem các đầu mục công việc liên quan tới vai trò <strong>{activeRole?.name}</strong>
            </p>
          </div>
        </div>

        {/* Switch Person Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Xem thành viên khác:</span>
          <select
            value={activePerson?.id || ''}
            onChange={(e) => setPerspectivePersonId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {people.map((p) => {
              const r = roles.find((role) => role.id === p.roleId);
              return (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({r?.name})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Filter Tabs: TẤT CẢ, TÔI CẦM CHÍNH, TÔI PHỐI HỢP, TÔI CHỐT */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeFilter === 'ALL'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tất cả liên quan ({displayedTasks.length})
        </button>
        <button
          onClick={() => setActiveFilter('OWNER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeFilter === 'OWNER'
              ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tôi cầm chính ({ownerTasks.length})
        </button>
        <button
          onClick={() => setActiveFilter('COLLAB')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeFilter === 'COLLAB'
              ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tôi phối hợp ({collabTasks.length})
        </button>
        <button
          onClick={() => setActiveFilter('APPROVER')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeFilter === 'APPROVER'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Tôi chốt ({approverTasks.length})
        </button>
      </div>

      {/* Main Task Cards Display */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedTasks.map((task) => renderTaskCard(task))}
        </div>
        {displayedTasks.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-400">
            Không có công việc nào theo bộ lọc này.
          </div>
        )}
      </div>

      {/* RELATIONSHIP DEPENDENCY SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        {/* ĐANG CHỜ NGƯỜI KHÁC */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Đang chờ người khác ({waitingOnOthers.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Các công việc của bạn chưa thể hoàn tất vì còn phụ thuộc vào kết quả của công việc khác
          </p>

          <div className="space-y-2.5">
            {waitingOnOthers.map((task) => {
              const incoming = taskLinks.filter((l) => l.targetTaskId === task.id);
              const blocker = incoming
                .map((l) => tasks.find((t) => t.id === l.sourceTaskId))
                .find((t) => t && t.status !== 'DONE');

              return renderTaskCard(
                task,
                blocker
                  ? `Đang chờ [${blocker.id}] ${blocker.title} (${blocker.ownerRoleId ? `ROLE ${blocker.ownerRoleId}` : ''}) hoàn thành`
                  : undefined
              );
            })}
            {waitingOnOthers.length === 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                ✓ Không có công việc nào bị nghẽn do chờ người khác.
              </div>
            )}
          </div>
        </div>

        {/* NGƯỜI KHÁC ĐANG CHỜ TÔI */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Người khác đang chờ tôi ({othersWaitingOnMe.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Các công việc của bạn là đầu vào cho vai trò khác, cần ưu tiên hoàn tất sớm
          </p>

          <div className="space-y-2.5">
            {othersWaitingOnMe.map(({ myTask, blockedTask }) =>
              renderTaskCard(
                myTask,
                `Đầu ra task này cần bàn giao cho [${blockedTask.id}] ${blockedTask.title} (ROLE ${blockedTask.ownerRoleId})`
              )
            )}
            {othersWaitingOnMe.length === 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400 text-center">
                ✓ Chưa có đồng đội nào đang bị tắc do chờ kết quả của bạn.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
