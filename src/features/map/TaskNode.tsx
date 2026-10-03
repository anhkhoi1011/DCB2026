import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Calendar, CheckCircle2, Clock, AlertCircle, PauseCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Task, RoleId } from '../../types';

export interface TaskNodeData {
  task: Task;
  isDimmed: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
}

export const TaskNode = memo(({ data }: { data: TaskNodeData }) => {
  const { task, isDimmed, isHighlighted, isSelected } = data;
  const { people, setSelectedTaskId } = useAppStore();

  const ownerPerson = people.find((p) => p.id === task.ownerPersonId) ||
    people.find((p) => p.roleId === task.ownerRoleId && p.isPrimary);

  const dotColors: Record<RoleId, string> = {
    1: 'bg-blue-600',
    2: 'bg-purple-600',
    3: 'bg-emerald-600',
    4: 'bg-orange-600',
  };

  const statusConfigs: Record<
    string,
    { icon: React.ReactNode; text: string; badgeClass: string; borderAccent: string }
  > = {
    NOT_STARTED: {
      icon: <Clock className="w-2.5 h-2.5 text-slate-400" />,
      text: 'Chưa làm',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      borderAccent: 'border-t-2 border-t-slate-400',
    },
    IN_PROGRESS: {
      icon: <Clock className="w-2.5 h-2.5 text-amber-500" />,
      text: 'Đang làm',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      borderAccent: 'border-t-2 border-t-amber-500',
    },
    DONE: {
      icon: <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />,
      text: 'Hoàn thành',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      borderAccent: 'border-t-2 border-t-emerald-500',
    },
    BLOCKED: {
      icon: <AlertCircle className="w-2.5 h-2.5 text-rose-500" />,
      text: 'Bị vướng',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      borderAccent: 'border-t-2 border-t-rose-500',
    },
    ON_HOLD: {
      icon: <PauseCircle className="w-2.5 h-2.5 text-zinc-400" />,
      text: 'Tạm dừng',
      badgeClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
      borderAccent: 'border-t-2 border-t-zinc-400',
    },
  };

  const statusInfo = statusConfigs[task.status] || statusConfigs.NOT_STARTED;

  // Format date DD/MM
  let formattedDate = '';
  if (task.dueAt) {
    const datePart = task.dueAt.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}`;
    }
  }

  const collabs = task.collaborators || [];

  return (
    <div
      onClick={() => setSelectedTaskId(task.id)}
      className={`w-[200px] h-[110px] min-h-[110px] max-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs select-none relative group bg-white dark:bg-slate-900 ${
        statusInfo.borderAccent
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
          : isHighlighted
          ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/40'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      } ${isDimmed ? 'opacity-15 grayscale-[50%]' : 'opacity-100'}`}
      title={task.title}
    >
      <Handle type="target" position={Position.Top} className="!opacity-70" />
      <Handle type="source" position={Position.Bottom} className="!opacity-70" />
      <Handle type="target" position={Position.Left} id="left" className="!opacity-70" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-70" />

      {/* Floating Output tooltip on hover or selected */}
      {task.output && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 -top-8 w-max max-w-[220px] px-2 py-1 bg-slate-900/95 dark:bg-slate-800/95 text-white text-[10px] rounded-md shadow-lg z-30 pointer-events-none truncate border border-slate-700 transition-opacity duration-150 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="font-semibold text-blue-300">Output:</span> {task.output}
        </div>
      )}

      {/* Top: ID and Status Badge */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {task.id}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${statusInfo.badgeClass}`}
        >
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </span>
      </div>

      {/* Middle: Title (2 lines max) */}
      <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight my-auto">
        {task.title}
      </h4>

      {/* Bottom: People & Date */}
      <div className="flex items-center justify-between gap-1 text-[9px] pt-1 border-t border-slate-100 dark:border-slate-800/70">
        <div className="flex items-center gap-1 overflow-hidden">
          {/* Owner chip */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[task.ownerRoleId]}`} />
            <span>{ownerPerson?.shortName || `R${task.ownerRoleId}`}</span>
          </span>

          {/* Collaborator count chip */}
          {collabs.length > 0 && (
            <span
              className="inline-flex items-center px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 font-medium"
              title={`${collabs.length} người phối hợp`}
            >
              +{collabs.length}
            </span>
          )}
        </div>

        {/* Due date */}
        {formattedDate && (
          <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400 font-medium shrink-0">
            <Calendar className="w-2.5 h-2.5" />
            <span>{formattedDate}</span>
          </span>
        )}
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
