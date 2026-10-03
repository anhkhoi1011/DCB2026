import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId } from '../../types';

interface RoleBadgeProps {
  roleId: RoleId;
  showPerson?: boolean;
  size?: 'sm' | 'md';
  relationship?: 'owner' | 'collaborator' | 'approver';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  roleId,
  showPerson = true,
  size = 'md',
  relationship,
}) => {
  const { roles, people } = useAppStore();
  const role = roles.find((r) => r.id === roleId);
  const primaryPerson = people.find((p) => p.roleId === roleId && p.isPrimary);

  if (!role) return null;

  const colorClasses: Record<RoleId, { bg: string; text: string; border: string; dot: string }> = {
    1: {
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-600',
    },
    2: {
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-600',
    },
    3: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-600',
    },
    4: {
      bg: 'bg-orange-50 dark:bg-orange-950/60',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      dot: 'bg-orange-600',
    },
  };

  const style = colorClasses[roleId];
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors ${style.bg} ${style.text} ${style.border} ${
        isSm ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
      title={`${role.name} (${primaryPerson?.fullName || 'Chưa gán'})`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{showPerson && primaryPerson ? primaryPerson.shortName : `R${role.id}`}</span>
      {relationship && (
        <span className="text-[10px] opacity-75 font-normal">
          {relationship === 'owner' ? '· Cầm chính' : relationship === 'approver' ? '· Chốt' : '· Phối hợp'}
        </span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const config: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    NOT_STARTED: {
      label: 'Chưa làm',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-300',
      dot: 'bg-slate-400',
    },
    IN_PROGRESS: {
      label: 'Đang làm',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    DONE: {
      label: 'Hoàn thành',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    BLOCKED: {
      label: 'Bị vướng',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
    ON_HOLD: {
      label: 'Tạm dừng',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
  };

  const item = config[status] || config.NOT_STARTED;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md ${item.bg} ${item.text} ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{item.label}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string; size?: 'sm' | 'md' }> = ({ priority, size = 'sm' }) => {
  const config: Record<string, { label: string; text: string; bg: string }> = {
    LOW: { label: 'Thấp', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    MEDIUM: { label: 'Vừa', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    HIGH: { label: 'Cao', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    URGENT: { label: 'Khẩn cấp', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  };

  const item = config[priority] || config.MEDIUM;

  return (
    <span className={`inline-flex items-center font-medium rounded px-1.5 py-0.5 text-[11px] ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
};
