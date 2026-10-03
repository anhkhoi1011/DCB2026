import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
  AlertTriangle,
  PauseCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleBadge, StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { RoleId } from '../../types';

export const OverviewView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
    taskLinks,
    setSelectedTaskId,
    setSelectedRoleId,
    setActiveTab,
  } = useAppStore();

  const totalTasks = tasks.length;
  const notStartedTasks = tasks.filter((t) => t.status === 'NOT_STARTED').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length;
  const onHoldTasks = tasks.filter((t) => t.status === 'ON_HOLD').length;

  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue: dueAt < today and not DONE
  const overdueTasks = tasks.filter((t) => t.dueAt && t.dueAt < todayStr && t.status !== 'DONE');

  // Due Soon: within next 3 days and not DONE
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dueSoonTasks = tasks.filter(
    (t) => t.dueAt && t.dueAt >= todayStr && t.dueAt <= threeDaysLater && t.status !== 'DONE'
  );

  // Overall Completion Rate: (doneActiveTasks / totalActiveTasks) * 100
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Waiting on someone else (Tasks with incomplete incoming dependencies)
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
            Theo dõi trạng thái các công việc trọng tâm, deadline và output cần bàn giao
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <span>Danh sách công việc</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <span>Bản đồ quan hệ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - 7 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Tasks */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Tổng công việc
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Công việc active</div>
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
            {totalTasks > 0 ? Math.round((notStartedTasks / totalTasks) * 100) : 0}% tổng số
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
            {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% đang chạy
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
            {completionRate}% hoàn tất
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

        {/* On Hold */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <PauseCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tạm dừng</span>
          </div>
          <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-1">
            {onHoldTasks}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Tạm hoãn</div>
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
          <div className="text-[10px] text-slate-400 mt-1">Cần đẩy tiến độ</div>
        </div>
      </div>

      {/* Completion Rate Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Tỷ Lệ Công Việc Đã Hoàn Thành</span>
            </h3>
            <p className="text-xs text-slate-500">
              {doneTasks} công việc hoàn thành / {totalTasks} công việc đang active ({completionRate}%)
            </p>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {completionRate}%
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* 4 Roles Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Trách Nhiệm Theo 4 Vai Trò Cốt Lõi
          </h2>
          <span className="text-xs text-slate-400">Bấm vào vai trò để lọc trên Bản đồ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => {
            const primaryPerson = people.find((p) => p.roleId === role.id && p.isPrimary);
            const myOwnerTasks = tasks.filter((t) => t.ownerRoleId === role.id);
            const myCollabTasks = tasks.filter((t) =>
              (t.collaborators || []).some((c) => c.roleId === role.id)
            );
            const allInvolved = [...myOwnerTasks, ...myCollabTasks];
            const roleDoneCount = allInvolved.filter((t) => t.status === 'DONE').length;

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
                    {roleDoneCount}/{allInvolved.length} hoàn thành
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-2">
                  {role.name}
                </h3>

                <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-3 flex items-center gap-1.5">
                  <span className="text-slate-400 font-normal">Phụ trách:</span>
                  <span>{primaryPerson?.fullName || 'Chưa gán'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{myOwnerTasks.length} việc cầm chính</span>
                  <span>·</span>
                  <span>{myCollabTasks.length} việc phối hợp</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attention Tasks */}
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
            Xem danh sách đầy đủ →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Overdue Items */}
          {overdueTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 cursor-pointer hover:bg-red-50 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                  {task.id} · Quá hạn
                </span>
                <span className="text-[11px] font-medium text-red-600">{task.dueAt}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {task.title}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Output: {task.output}</p>
              <div className="flex items-center justify-between pt-1">
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
                className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 cursor-pointer hover:bg-rose-50 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    {task.id} · Bị vướng
                  </span>
                  <PriorityBadge priority={task.priority || 'MEDIUM'} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {task.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">Output: {task.output}</p>
                <div className="flex items-center justify-between pt-1">
                  <RoleBadge roleId={task.ownerRoleId} size="sm" />
                  <span className="text-[11px] text-rose-600 font-medium">Cần hỗ trợ</span>
                </div>
              </div>
            ))}

          {/* Due soon */}
          {dueSoonTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer hover:bg-amber-50 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  {task.id} · Sắp đến hạn
                </span>
                <span className="text-[11px] font-medium text-amber-700">{task.dueAt}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                {task.title}
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">Output: {task.output}</p>
              <div className="flex items-center justify-between pt-1">
                <RoleBadge roleId={task.ownerRoleId} size="sm" />
                <StatusBadge status={task.status} size="sm" />
              </div>
            </div>
          ))}

          {overdueTasks.length === 0 &&
            tasks.filter((t) => t.status === 'BLOCKED').length === 0 &&
            dueSoonTasks.length === 0 && (
              <div className="col-span-3 text-center py-6 text-xs text-slate-500">
                ✓ Không có công việc nào bị quá hạn hoặc bị vướng lúc này.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
