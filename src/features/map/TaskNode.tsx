import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { Task, RoleId } from '../../types';

export interface TaskNodeData {
  task: Task;
  isDimmed: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
}

export const TaskNode = memo(({ data }: { data: TaskNodeData }) => {
  const { task, isDimmed, isHighlighted, isSelected } = data;
  const { roles, people, checklists, setSelectedTaskId } = useAppStore();

  const progress = getTaskProgress(task, checklists);
  const ownerRole = roles.find((r) => r.id === task.ownerRoleId);
  const ownerPerson = people.find((p) => p.roleId === task.ownerRoleId && p.isPrimary);

  const dotColors: Record<RoleId, string> = {
    1: 'bg-blue-600',
    2: 'bg-purple-600',
    3: 'bg-emerald-600',
    4: 'bg-orange-600',
  };

  const statusIcons: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    NOT_STARTED: {
      icon: <Clock className="w-3 h-3 text-slate-400" />,
      text: 'Chưa làm',
      color: 'text-slate-500',
    },
    IN_PROGRESS: {
      icon: <Clock className="w-3 h-3 text-amber-500" />,
      text: 'Đang làm',
      color: 'text-amber-600 dark:text-amber-400',
    },
    DONE: {
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
      text: 'Xong',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    BLOCKED: {
      icon: <AlertCircle className="w-3 h-3 text-rose-500" />,
      text: 'Vướng',
      color: 'text-rose-600 dark:text-rose-400',
    },
    ON_HOLD: {
      icon: <Clock className="w-3 h-3 text-zinc-400" />,
      text: 'Tạm dừng',
      color: 'text-zinc-500',
    },
  };

  const statusInfo = statusIcons[task.status] || statusIcons.NOT_STARTED;

  // Format date DD/MM
  let formattedDate = '';
  if (task.dueDate) {
    const parts = task.dueDate.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}`;
    }
  }

  return (
    <div
      onClick={() => setSelectedTaskId(task.id)}
      className={`w-60 rounded-xl border p-2.5 transition-all duration-200 cursor-pointer shadow-md select-none bg-white dark:bg-slate-900 ${
        isSelected
          ? 'ring-3 ring-blue-500 border-blue-500 shadow-blue-500/20 scale-105'
          : isHighlighted
          ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/40'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'
      } ${isDimmed ? 'opacity-15 grayscale-[50%]' : 'opacity-100'}`}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!opacity-70" />
      <Handle type="source" position={Position.Bottom} className="!opacity-70" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-70" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-70" />

      {/* ID and Category */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {task.id}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px]">
          {task.category}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-2 min-h-[30px]">
        {task.title}
      </h4>

      {/* People / Roles breakdown */}
      <div className="space-y-1 mb-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80 text-[11px]">
        {/* Owner */}
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[task.ownerRoleId]}`} />
            <span className="font-semibold truncate">
              {ownerPerson?.shortName || `R${task.ownerRoleId}`}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium shrink-0">● Cầm chính</span>
        </div>

        {/* Collaborators */}
        {task.collaboratorRoleIds && task.collaboratorRoleIds.length > 0 && (
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1 truncate">
              {task.collaboratorRoleIds.map((cRole) => {
                const cPerson = people.find((p) => p.roleId === cRole && p.isPrimary);
                return (
                  <span key={cRole} className="inline-flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[cRole]}`} />
                    <span className="truncate">{cPerson?.shortName || `R${cRole}`}</span>
                  </span>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400 font-normal shrink-0">
              ○ Phối hợp{task.approverRoleId ? ' / Chốt' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Status & Deadline */}
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <div className={`flex items-center gap-1 font-medium ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
        {formattedDate && (
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            <span>{formattedDate}</span>
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            progress === 100
              ? 'bg-emerald-500'
              : progress > 0
              ? 'bg-blue-600'
              : 'bg-transparent'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
