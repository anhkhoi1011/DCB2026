import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId } from '../../types';

export interface RoleNodeData {
  roleId: RoleId;
  isDimmed: boolean;
  isHighlighted: boolean;
}

export const RoleNode = memo(({ data }: { data: RoleNodeData }) => {
  const { roles, people, tasks, setSelectedRoleId } = useAppStore();
  const role = roles.find((r) => r.id === data.roleId);
  const primaryPerson = people.find((p) => p.roleId === data.roleId && p.isPrimary);

  if (!role) return null;

  const roleOwnerTasks = tasks.filter((t) => t.ownerRoleId === data.roleId);
  const roleCollabTasks = tasks.filter((t) =>
    (t.collaborators || []).some((c) => c.roleId === data.roleId)
  );
  const totalInvolved = [...roleOwnerTasks, ...roleCollabTasks];
  const completedCount = totalInvolved.filter((t) => t.status === 'DONE').length;

  const borderColors: Record<RoleId, string> = {
    1: 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 shadow-blue-500/20',
    2: 'border-purple-500 bg-purple-50/90 dark:bg-purple-950/80 shadow-purple-500/20',
    3: 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/80 shadow-emerald-500/20',
    4: 'border-orange-500 bg-orange-50/90 dark:bg-orange-950/80 shadow-orange-500/20',
  };

  const headerColors: Record<RoleId, string> = {
    1: 'text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50',
    2: 'text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/50',
    3: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50',
    4: 'text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-900/50',
  };

  return (
    <div
      onClick={() => setSelectedRoleId(data.roleId)}
      className={`w-72 rounded-2xl border-2 p-3.5 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md select-none ${
        borderColors[data.roleId]
      } ${
        data.isDimmed ? 'opacity-15 grayscale-[50%]' : 'opacity-100'
      } ${
        data.isHighlighted
          ? 'scale-105 ring-4 ring-offset-2 ring-blue-500/50 dark:ring-offset-slate-900'
          : 'hover:scale-102'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-70" />
      <Handle type="source" position={Position.Bottom} className="!opacity-70" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-70" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-70" />

      {/* Role Header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold tracking-wider ${headerColors[data.roleId]}`}
        >
          ROLE 0{data.roleId}
        </span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {completedCount}/{totalInvolved.length} hoàn thành
        </span>
      </div>

      {/* Role Title */}
      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight line-clamp-1 mb-2">
        {role.name}
      </h3>

      {/* Primary Person */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 mb-2.5">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
          {primaryPerson?.shortName ? primaryPerson.shortName.charAt(0) : <User className="w-3.5 h-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {primaryPerson?.fullName || 'Chưa gán thành viên'}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Người phụ trách chính
          </div>
        </div>
      </div>

      {/* Duty Summary */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium px-0.5">
        <span>{roleOwnerTasks.length} việc cầm chính</span>
        <span>·</span>
        <span>{roleCollabTasks.length} việc phối hợp</span>
      </div>
    </div>
  );
});

RoleNode.displayName = 'RoleNode';
