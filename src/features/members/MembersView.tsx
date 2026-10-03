import React, { useState } from 'react';
import {
  Users,
  Plus,
  UserCheck,
  Edit2,
  Check,
  X,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleBadge } from '../../components/common/Badges';
import { RoleId, Person } from '../../types';

export const MembersView: React.FC = () => {
  const { roles, people, tasks, updatePerson, addPerson, setPrimaryPerson } = useAppStore();

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editShortName, setEditShortName] = useState('');

  // New member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newRoleId, setNewRoleId] = useState<RoleId>(1);

  const startEdit = (person: Person) => {
    setEditingPersonId(person.id);
    setEditFullName(person.fullName);
    setEditShortName(person.shortName);
  };

  const saveEdit = (personId: string) => {
    if (!editFullName.trim()) return;
    updatePerson(personId, {
      fullName: editFullName.trim(),
      shortName: editShortName.trim() || editFullName.trim().split(' ').pop(),
    });
    setEditingPersonId(null);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;
    addPerson({
      fullName: newFullName.trim(),
      shortName: newShortName.trim() || newFullName.trim().split(' ').pop() || 'TV',
      roleId: newRoleId,
      isPrimary: false,
      active: true,
    });
    setNewFullName('');
    setNewShortName('');
    setShowAddModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Thành Viên &amp; 4 Vai Trò Cốt Lõi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Công việc gắn chặt vào <strong>ROLE</strong>. Khi thay đổi người phụ trách vai trò, toàn bộ công việc tự động cập nhật!
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thành viên</span>
        </button>
      </div>

      {/* 4 Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const rolePeople = people.filter((p) => p.roleId === role.id);
          const primaryPerson = rolePeople.find((p) => p.isPrimary);
          const supportPeople = rolePeople.filter((p) => !p.isPrimary);

          const ownerTasks = tasks.filter((t) => t.ownerRoleId === role.id);
          const collabTasks = tasks.filter((t) => (t.collaborators || []).some((c) => c.roleId === role.id));

          const roleColors: Record<RoleId, { cardBorder: string; headerBg: string; textBadge: string; dot: string }> = {
            1: {
              cardBorder: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10',
              headerBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
              textBadge: 'text-blue-600',
              dot: 'bg-blue-600',
            },
            2: {
              cardBorder: 'border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10',
              headerBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300',
              textBadge: 'text-purple-600',
              dot: 'bg-purple-600',
            },
            3: {
              cardBorder: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10',
              headerBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
              textBadge: 'text-emerald-600',
              dot: 'bg-emerald-600',
            },
            4: {
              cardBorder: 'border-orange-200 dark:border-orange-900/60 bg-orange-50/20 dark:bg-orange-950/10',
              headerBg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
              textBadge: 'text-orange-600',
              dot: 'bg-orange-600',
            },
          };

          const style = roleColors[role.id];

          return (
            <div
              key={role.id}
              className={`p-5 rounded-2xl border ${style.cardBorder} bg-white dark:bg-slate-900 shadow-sm space-y-4`}
            >
              {/* Header Role Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${style.dot}`} />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      VAI TRÒ 0{role.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {role.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>{ownerTasks.length} việc chính</span>
                  <span>·</span>
                  <span>{collabTasks.length} việc phối hợp</span>
                </div>
              </div>

              {/* Primary Person Section */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Người phụ trách chính (Primary Person)
                </div>

                {primaryPerson ? (
                  editingPersonId === primaryPerson.id ? (
                    <div className="p-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                            Tên hiển thị ngắn
                          </label>
                          <input
                            type="text"
                            value={editShortName}
                            onChange={(e) => setEditShortName(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => setEditingPersonId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => saveEdit(primaryPerson.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
                        >
                          <Check className="w-3 h-3" />
                          <span>Lưu</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm">
                          {primaryPerson.shortName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {primaryPerson.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Hiển thị: <strong>[{primaryPerson.shortName}]</strong>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(primaryPerson)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 rounded-lg transition"
                        title="Đổi tên thành viên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Chưa gán người phụ trách chính cho vai trò này.
                  </div>
                )}
              </div>

              {/* Support Members */}
              {supportPeople.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Thành viên hỗ trợ thêm ({supportPeople.length})
                  </div>
                  <div className="space-y-1.5">
                    {supportPeople.map((sup) => (
                      <div
                        key={sup.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {sup.fullName} ({sup.shortName})
                        </span>
                        <button
                          onClick={() => setPrimaryPerson(role.id, sup.id)}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Chuyển làm người phụ trách chính
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Duties */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nhiệm vụ tổng quát của vai trò
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {role.generalDuties.map((duty, idx) => (
                    <li key={idx}>{duty}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Thêm Thành Viên Vào Đội
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trần Văn Bình"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị ngắn (Chip)
                </label>
                <input
                  type="text"
                  placeholder="VD: Bình"
                  value={newShortName}
                  onChange={(e) => setNewShortName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thuộc vai trò cốt lõi
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(Number(e.target.value) as RoleId)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      0{r.id} - {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Thêm thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
