import React, { useState, useMemo } from 'react';
import {
  TableProperties,
  Plus,
  Search,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  Trash2,
  X,
  User,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId, TaskStatus, TaskPriority, Task } from '../../types';

export const TaskTableView: React.FC = () => {
  const {
    tasks,
    roles,
    people,
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
    selectedRowIds,
    toggleSelectRow,
    selectAllRows,
    clearRowSelection,
    bulkSetDueAt,
    bulkSetStatus,
    bulkDeleteTasks,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'id' | 'title' | 'status' | 'dueAt' | 'priority'>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [bulkDueDate, setBulkDueDate] = useState('');

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
      // Role filter (matches owner or any collaborator)
      if (filterRole !== 'ALL') {
        const isOwner = t.ownerRoleId === filterRole;
        const isCollab = (t.collaborators || []).some((c) => c.roleId === filterRole);
        if (!isOwner && !isCollab) return false;
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
        const matchCat = (t.category || '').toLowerCase().includes(q);
        const matchOutput = (t.output || '').toLowerCase().includes(q);
        const ownerPerson = people.find((p) => p.id === t.ownerPersonId);
        const matchOwner = ownerPerson?.fullName.toLowerCase().includes(q) || ownerPerson?.shortName.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchCat && !matchOutput && !matchOwner) return false;
      }
      return true;
    });
  }, [tasks, filterRole, filterStatus, filterPriority, filterCategory, search, people]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';
      if (sortField === 'id') {
        return sortAsc
          ? valA.localeCompare(valB, undefined, { numeric: true })
          : valB.localeCompare(valA, undefined, { numeric: true });
      }
      if (sortField === 'dueAt') {
        valA = a.dueAt || '9999-99-99';
        valB = b.dueAt || '9999-99-99';
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortField, sortAsc]);

  const toggleSort = (field: 'id' | 'title' | 'status' | 'dueAt' | 'priority') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const allFilteredSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedRowIds.includes(t.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      clearRowSelection();
    } else {
      selectAllRows(filteredTasks.map((t) => t.id));
    }
  };

  const handleApplyBulkDueDate = (dateStr: string) => {
    setBulkDueDate(dateStr);
    if (dateStr) {
      bulkSetDueAt(selectedRowIds, dateStr);
    }
  };

  const getRoleDotColor = (roleId: RoleId) => {
    switch (roleId) {
      case 1:
        return 'bg-blue-500';
      case 2:
        return 'bg-purple-500';
      case 3:
        return 'bg-emerald-500';
      case 4:
        return 'bg-orange-500';
      default:
        return 'bg-slate-400';
    }
  };

  const statusLabels: Record<TaskStatus, { text: string; bg: string; textClass: string }> = {
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
            Xem toàn bộ công việc, lọc theo vai trò và chỉnh sửa nhanh trạng thái / hạn hoàn thành trực tiếp
          </p>
        </div>

        <button
          onClick={() => openTaskForm()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
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
              placeholder="Tìm kiếm theo mã, tên, người, output..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value === 'ALL' ? 'ALL' : (Number(e.target.value) as RoleId))
            }
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

        {/* Bulk Action Bar */}
        {selectedRowIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
              <span className="font-bold">{selectedRowIds.length}</span> công việc được chọn
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Set Status */}
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    bulkSetStatus(selectedRowIds, e.target.value as TaskStatus);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-700 dark:text-slate-200"
              >
                <option value="" disabled>
                  Đổi trạng thái...
                </option>
                <option value="NOT_STARTED">Chưa làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
                <option value="BLOCKED">Bị vướng</option>
                <option value="ON_HOLD">Tạm dừng</option>
              </select>

              {/* Set Due Date */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 border border-blue-300 dark:border-blue-700 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={bulkDueDate}
                  onChange={(e) => handleApplyBulkDueDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  title="Đặt hạn hoàn thành cho các mục đã chọn"
                />
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa ${selectedRowIds.length} công việc đã chọn?`)) {
                    bulkDeleteTasks(selectedRowIds);
                    clearRowSelection();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={clearRowSelection}
                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md text-slate-500"
                title="Bỏ chọn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                {/* Select column */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    aria-label="Chọn tất cả"
                  />
                </th>

                {/* ID & Title */}
                <th
                  onClick={() => toggleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[240px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Công việc</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                {/* Status */}
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[130px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Trạng thái</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                {/* Owner */}
                <th className="py-3 px-4 min-w-[140px]">Cầm chính</th>

                {/* Collaborators */}
                <th className="py-3 px-4 min-w-[160px]">Phối hợp</th>

                {/* Deadline (dueAt) */}
                <th
                  onClick={() => toggleSort('dueAt')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none min-w-[130px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Hạn hoàn thành</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                {/* Output */}
                <th className="py-3 px-4 min-w-[200px]">Output cần bàn giao</th>

                {/* Priority */}
                <th
                  onClick={() => toggleSort('priority')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 select-none w-24 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Ưu tiên</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sortedTasks.map((task) => {
                const isSelected = selectedRowIds.includes(task.id);
                const ownerPerson =
                  people.find((p) => p.id === task.ownerPersonId) ||
                  people.find((p) => p.roleId === task.ownerRoleId && p.isPrimary);
                const ownerDisplayName = ownerPerson ? ownerPerson.shortName : `R${task.ownerRoleId}`;

                const collabs = (task.collaborators || []).map((c) => {
                  const p = people.find((person) => person.id === c.personId);
                  return {
                    roleId: c.roleId,
                    displayName: p ? p.shortName : `R${c.roleId}`,
                  };
                });

                const isOverdue =
                  Boolean(task.dueAt) &&
                  task.status !== 'DONE' &&
                  new Date(task.dueAt!).getTime() < new Date().setHours(0, 0, 0, 0);

                const currentStatus = statusLabels[task.status] || statusLabels.NOT_STARTED;

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Select */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(task.id)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        aria-label={`Chọn task ${task.id}`}
                      />
                    </td>

                    {/* Task (ID + Title + Category) */}
                    <td
                      onClick={() => setSelectedTaskId(task.id)}
                      className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer max-w-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {task.id}
                        </span>
                        <span className="line-clamp-1 hover:text-blue-600 transition">
                          {task.title}
                        </span>
                      </div>
                      {task.category && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 ml-8">
                          {task.category}
                        </div>
                      )}
                    </td>

                    {/* Status (Inline Select) */}
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask(task.id, { status: e.target.value as TaskStatus })
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-0 ${currentStatus.bg} ${currentStatus.textClass}`}
                      >
                        <option value="NOT_STARTED">Chưa làm</option>
                        <option value="IN_PROGRESS">Đang làm</option>
                        <option value="DONE">Hoàn thành</option>
                        <option value="BLOCKED">Bị vướng</option>
                        <option value="ON_HOLD">Tạm dừng</option>
                      </select>
                    </td>

                    {/* Owner (Resolved from Person) */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <span className={`w-2 h-2 rounded-full ${getRoleDotColor(task.ownerRoleId)}`} />
                        <span className="font-medium text-xs">{ownerDisplayName}</span>
                      </div>
                    </td>

                    {/* Collaborators (Resolved from task.collaborators[]) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {collabs.length > 0 ? (
                          collabs.map((c, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${getRoleDotColor(c.roleId)}`} />
                              <span>{c.displayName}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Việc riêng</span>
                        )}
                      </div>
                    </td>

                    {/* Deadline (dueAt) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={task.dueAt || ''}
                          onChange={(e) => updateTask(task.id, { dueAt: e.target.value || null })}
                          className={`text-xs bg-transparent border-0 p-0 cursor-pointer focus:ring-0 ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        />
                        {isOverdue && (
                          <span
                            title="Quá hạn hoàn thành"
                            className="inline-flex items-center text-[10px] text-rose-500 font-bold"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Output */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <p className="line-clamp-2 text-xs leading-relaxed max-w-md">
                        {task.output || <span className="text-slate-400 italic">Chưa bàn giao</span>}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-right">
                      {task.priority ? (
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : task.priority === 'MEDIUM'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {task.priority === 'URGENT'
                            ? 'Khẩn'
                            : task.priority === 'HIGH'
                            ? 'Cao'
                            : task.priority === 'MEDIUM'
                            ? 'Vừa'
                            : 'Thấp'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
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
