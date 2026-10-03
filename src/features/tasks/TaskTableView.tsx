import React, { useState, useMemo } from 'react';
import {
  TableProperties,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore, getTaskProgress } from '../../store/useAppStore';
import { RoleBadge, StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { RoleId, TaskStatus, TaskPriority, Task } from '../../types';

export const TaskTableView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
    checklists,
    setSelectedTaskId,
    updateTask,
    openTaskForm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterCategory,
    setFilterCategory,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'id' | 'title' | 'dueDate' | 'priority' | 'status'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  const categories = [
    'Nghiên cứu',
    'Kế hoạch',
    'Gian hàng',
    'Marketing',
    'Nội dung',
    'Vận hành',
    'Dữ liệu',
    'Khách hàng',
    'Báo cáo',
    'Khác',
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Role filter
      if (filterRole !== 'ALL' && t.ownerRoleId !== filterRole && !(t.collaboratorRoleIds || []).includes(filterRole)) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'ALL' && t.status !== filterStatus) {
        return false;
      }
      // Priority filter
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) {
        return false;
      }
      // Category filter
      if (filterCategory !== 'ALL' && t.category !== filterCategory) {
        return false;
      }
      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const ownerPerson = people.find((p) => p.roleId === t.ownerRoleId && p.isPrimary);
        const matchOwner = ownerPerson?.fullName.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchCat && !matchOwner) return false;
      }
      return true;
    });
  }, [tasks, filterRole, filterStatus, filterPriority, filterCategory, search, people]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';
      if (sortField === 'id') {
        return sortAsc ? valA.localeCompare(valB, undefined, { numeric: true }) : valB.localeCompare(valA, undefined, { numeric: true });
      }
      if (sortField === 'dueDate') {
        valA = a.dueDate || '9999-99-99';
        valB = b.dueDate || '9999-99-99';
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortField, sortAsc]);

  const toggleSort = (field: 'id' | 'title' | 'dueDate' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-blue-600" />
            <span>Danh Sách Công Việc (Task Table)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem toàn bộ công việc, lọc theo vai trò và chỉnh sửa nhanh trạng thái / hạn chót trực tiếp
          </p>
        </div>

        <button
          onClick={() => openTaskForm()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công việc</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên, người..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value === 'ALL' ? 'ALL' : (Number(e.target.value) as RoleId))}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Tất cả vai trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                0{r.id} - {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="NOT_STARTED">Chưa làm</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="DONE">Hoàn thành</option>
            <option value="BLOCKED">Bị vướng</option>
            <option value="ON_HOLD">Tạm dừng</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Vừa</option>
            <option value="HIGH">Cao</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Tất cả nhóm</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th
                  onClick={() => toggleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none w-20"
                >
                  <div className="flex items-center gap-1">
                    <span>Mã ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[220px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Tên công việc</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[130px]">Cầm chính</th>
                <th className="py-3 px-4 min-w-[140px]">Phối hợp</th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[130px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Trạng thái</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none w-24"
                >
                  <div className="flex items-center gap-1">
                    <span>Ưu tiên</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('dueDate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[120px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Hạn chót</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 w-28 text-right">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedTasks.map((task) => {
                const progress = getTaskProgress(task, checklists);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* ID */}
                    <td
                      onClick={() => setSelectedTaskId(task.id)}
                      className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {task.id}
                      </span>
                    </td>

                    {/* Title */}
                    <td
                      onClick={() => setSelectedTaskId(task.id)}
                      className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer max-w-xs"
                    >
                      <div className="line-clamp-1">{task.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {task.category}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-4">
                      <RoleBadge roleId={task.ownerRoleId} size="sm" />
                    </td>

                    {/* Collaborators */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {task.collaboratorRoleIds && task.collaboratorRoleIds.length > 0 ? (
                          task.collaboratorRoleIds.map((cRole) => (
                            <RoleBadge key={cRole} roleId={cRole} size="sm" />
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Việc riêng</span>
                        )}
                      </div>
                    </td>

                    {/* Status (Inline Select) */}
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                        className="text-xs bg-transparent border-0 font-semibold cursor-pointer focus:ring-0 p-0 hover:underline"
                      >
                        <option value="NOT_STARTED">Chưa làm</option>
                        <option value="IN_PROGRESS">Đang làm</option>
                        <option value="DONE">Hoàn thành</option>
                        <option value="BLOCKED">Bị vướng</option>
                        <option value="ON_HOLD">Tạm dừng</option>
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    {/* Due Date (Inline Date) */}
                    <td className="py-3 px-4">
                      <input
                        type="date"
                        value={task.dueDate || ''}
                        onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                        className="text-xs bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer"
                      />
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-blue-600">{progress}%</span>
                    </td>
                  </tr>
                );
              })}
              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy công việc nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
