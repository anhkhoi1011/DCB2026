import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { RoleBadge, StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { RoleId } from '../../types';

export const OverviewView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
    checklists,
    taskLinks,
    setSelectedTaskId,
    setSelectedRoleId,
    setActiveTab,
    openTaskForm,
  } = useAppStore();

  const totalTasks = tasks.length;
  const notStartedTasks = tasks.filter((t) => t.status === 'NOT_STARTED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue: dueDate < today and not DONE
  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE');

  // Due Soon: within next 3 days and not DONE
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dueSoonTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= threeDaysLater && t.status !== 'DONE'
  );

  // Overall Team Progress
  const teamOverallProgress =
    totalTasks > 0
      ? Math.round(
          tasks.reduce((acc, t) => acc + getTaskProgress(t, checklists), 0) / totalTasks
        )
      : 0;

  // Waiting on someone else (Tasks blocked by incomplete dependencies)
  const waitingTasks = tasks.filter((t) => {
    if (t.status === 'DONE') return false;
    const incoming = taskLinks.filter((l) => l.targetTaskId === t.id);
    return incoming.some((link) => {
      const pred = tasks.find((item) => item.id === link.sourceTaskId);
      return pred && pred.status !== 'DONE';
    });
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Tổng Quan Chiến Dịch Bán Hàng DBC 2026
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến độ toàn đội, trách nhiệm 4 vai trò và các công việc cần chú ý
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('map')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 transition"
          >
            <span>Mở Bản đồ quan hệ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Tổng công việc
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">100% mục tiêu</div>
        </div>

        {/* Not Started */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Chưa làm</span>
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {notStartedTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {Math.round((notStartedTasks / totalTasks) * 100 || 0)}% tổng số
          </div>
        </div>

        {/* In Progress */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Đang làm</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {inProgressTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {Math.round((inProgressTasks / totalTasks) * 100 || 0)}% đang chạy
          </div>
        </div>

        {/* Done */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hoàn thành</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {doneTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {Math.round((doneTasks / totalTasks) * 100 || 0)}% hoàn tất
          </div>
        </div>

        {/* Blocked */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Bị vướng</span>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {blockedTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cần hỗ trợ gỡ</div>
        </div>

        {/* Overdue */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>Quá hạn</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {overdueTasks.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Cần ưu tiên gấp</div>
        </div>
      </div>

      {/* Overall Progress Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Tiến độ tổng thể toàn đội</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tổng hợp tiến độ hoàn thành các đầu mục công việc và checklist
            </p>
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {teamOverallProgress}%
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 rounded-full"
            style={{ width: `${teamOverallProgress}%` }}
          />
        </div>
      </div>

      {/* 4 Roles Progress Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tiến độ &amp; Trách nhiệm theo 4 Vai trò
          </h2>
          <span className="text-xs text-slate-400">Bấm vào vai trò để truy vết trên Bản đồ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => {
            const primaryPerson = people.find((p) => p.roleId === role.id && p.isPrimary);
            const myOwnerTasks = tasks.filter((t) => t.ownerRoleId === role.id);
            const myCollabTasks = tasks.filter((t) => (t.collaboratorRoleIds || []).includes(role.id));
            const allInvolved = [...myOwnerTasks, ...myCollabTasks];

            const roleDoneCount = allInvolved.filter((t) => t.status === 'DONE').length;
            const roleProgress =
              allInvolved.length > 0
                ? Math.round(
                    allInvolved.reduce((acc, t) => acc + getTaskProgress(t, checklists), 0) /
                      allInvolved.length
                  )
                : 0;

            const borderColors: Record<RoleId, string> = {
              1: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20',
              2: 'border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20',
              3: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20',
              4: 'border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20',
            };

            const dotColors: Record<RoleId, string> = {
              1: 'bg-blue-600',
              2: 'bg-purple-600',
              3: 'bg-emerald-600',
              4: 'bg-orange-600',
            };

            return (
              <div
                key={role.id}
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setActiveTab('map');
                }}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-md ${borderColors[role.id]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColors[role.id]}`} />
                    <span className="text-xs font-mono font-bold text-slate-500">0{role.id}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {roleProgress}%
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">
                  {role.name}
                </h3>

                {/* Primary Person */}
                <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-3 flex items-center gap-1.5">
                  <span className="text-slate-400 font-normal">Phụ trách:</span>
                  <span>{primaryPerson?.fullName || 'Chưa gán'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  <span>{myOwnerTasks.length} việc chính</span>
                  <span>·</span>
                  <span>{myCollabTasks.length} việc phối hợp</span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${dotColors[role.id]}`}
                    style={{ width: `${roleProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TASK CẦN CHÚ Ý (Attention Tasks) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Công việc cần chú ý</span>
            </h3>
            <p className="text-xs text-slate-500">
              Các công việc quá hạn, sắp đến hạn, bị vướng hoặc đang chờ người khác
            </p>
          </div>
          <button
            onClick={() => setActiveTab('tasks')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Xem tất cả trong bảng →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Overdue Items */}
          {overdueTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 cursor-pointer hover:bg-red-50 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                  {task.id} · Quá hạn
                </span>
                <span className="text-[11px] font-medium text-red-600">
                  {task.dueDate}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">
                {task.title}
              </h4>
              <div className="flex items-center justify-between">
                <RoleBadge roleId={task.ownerRoleId} size="sm" />
                <StatusBadge status={task.status} size="sm" />
              </div>
            </div>
          ))}

          {/* Blocked Items */}
          {tasks
            .filter((t) => t.status === 'BLOCKED')
            .slice(0, 3)
            .map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 cursor-pointer hover:bg-rose-50 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    {task.id} · Bị vướng
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">
                  {task.title}
                </h4>
                <div className="flex items-center justify-between">
                  <RoleBadge roleId={task.ownerRoleId} size="sm" />
                  <span className="text-[11px] text-rose-600 font-medium">Cần xử lý rào cản</span>
                </div>
              </div>
            ))}

          {/* Waiting on others */}
          {waitingTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-50 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  {task.id} · Đang chờ kết quả
                </span>
                <StatusBadge status={task.status} size="sm" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">
                {task.title}
              </h4>
              <div className="flex items-center justify-between">
                <RoleBadge roleId={task.ownerRoleId} size="sm" />
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Chờ hoàn thành task trước
                </span>
              </div>
            </div>
          ))}

          {overdueTasks.length === 0 && tasks.filter((t) => t.status === 'BLOCKED').length === 0 && waitingTasks.length === 0 && (
            <div className="col-span-3 text-center py-6 text-xs text-slate-500">
              ✓ Không có công việc nào bị tắc nghẽn hoặc quá hạn lúc này.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
