import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId, TaskStatus, TaskPriority, TaskCategory, Task } from '../../types';

export const TaskFormModal: React.FC = () => {
  const {
    isTaskFormOpen,
    editingTaskId,
    closeTaskForm,
    tasks,
    roles,
    people,
    addTask,
    updateTask,
    checklists,
    addChecklistItem,
    taskLinks,
    addTaskLink,
  } = useAppStore();

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Kế hoạch');
  const [ownerRoleId, setOwnerRoleId] = useState<RoleId>(1);
  const [collaboratorRoleIds, setCollaboratorRoleIds] = useState<RoleId[]>([]);
  const [approverRoleId, setApproverRoleId] = useState<RoleId | undefined>(undefined);
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [howTo, setHowTo] = useState('');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [inputsText, setInputsText] = useState('');
  const [outputsText, setOutputsText] = useState('');
  const [predecessorTaskId, setPredecessorTaskId] = useState<string>('');
  const [successorTaskId, setSuccessorTaskId] = useState<string>('');

  // Initial checklist items to create for new tasks
  const [initialChecklists, setInitialChecklists] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // Responsibilities per role
  const [responsibilities, setResponsibilities] = useState<Partial<Record<RoleId, string>>>({});

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category);
      setOwnerRoleId(editingTask.ownerRoleId);
      setCollaboratorRoleIds(editingTask.collaboratorRoleIds || []);
      setApproverRoleId(editingTask.approverRoleId);
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate || '');
      setDescription(editingTask.description || '');
      setHowTo(editingTask.howTo || '');
      setDefinitionOfDone(editingTask.definitionOfDone || '');
      setInputsText((editingTask.inputs || []).join('\n'));
      setOutputsText((editingTask.outputs || []).join('\n'));
      setResponsibilities(editingTask.responsibilitiesByRole || {});
      setInitialChecklists([]);
    } else {
      // Defaults for brand new task
      setTitle('');
      setCategory('Kế hoạch');
      setOwnerRoleId(1);
      setCollaboratorRoleIds([]);
      setApproverRoleId(undefined);
      setStatus('NOT_STARTED');
      setPriority('MEDIUM');
      setDueDate('');
      setDescription('');
      setHowTo('');
      setDefinitionOfDone('');
      setInputsText('');
      setOutputsText('');
      setResponsibilities({});
      setInitialChecklists([]);
    }
  }, [editingTask, isTaskFormOpen]);

  if (!isTaskFormOpen) return null;

  const toggleCollaborator = (roleId: RoleId) => {
    if (roleId === ownerRoleId) return;
    if (collaboratorRoleIds.includes(roleId)) {
      setCollaboratorRoleIds(collaboratorRoleIds.filter((r) => r !== roleId));
    } else {
      setCollaboratorRoleIds([...collaboratorRoleIds, roleId]);
    }
  };

  const handleAddInitialChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistInput.trim()) return;
    setInitialChecklists([...initialChecklists, newChecklistInput.trim()]);
    setNewChecklistInput('');
  };

  const handleRemoveInitialChecklist = (index: number) => {
    setInitialChecklists(initialChecklists.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedInputs = inputsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedOutputs = outputsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        category,
        ownerRoleId,
        collaboratorRoleIds,
        approverRoleId: approverRoleId || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        description: description.trim(),
        howTo: howTo.trim() || undefined,
        definitionOfDone: definitionOfDone.trim() || undefined,
        inputs: parsedInputs,
        outputs: parsedOutputs,
        responsibilitiesByRole: responsibilities,
      });

      // Add link if selected
      if (predecessorTaskId && predecessorTaskId !== editingTask.id) {
        addTaskLink({
          sourceTaskId: predecessorTaskId,
          targetTaskId: editingTask.id,
          linkType: 'DEPENDENCY',
        });
      }
      if (successorTaskId && successorTaskId !== editingTask.id) {
        addTaskLink({
          sourceTaskId: editingTask.id,
          targetTaskId: successorTaskId,
          linkType: 'DEPENDENCY',
        });
      }
    } else {
      // Generate standard readable Task ID (e.g., T-101 or auto code)
      const nextId = `T-${(tasks.length + 1).toString().padStart(2, '0')}`;
      addTask({
        id: nextId,
        title: title.trim(),
        category,
        ownerRoleId,
        collaboratorRoleIds,
        approverRoleId: approverRoleId || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        description: description.trim(),
        howTo: howTo.trim() || undefined,
        definitionOfDone: definitionOfDone.trim() || undefined,
        inputs: parsedInputs,
        outputs: parsedOutputs,
        responsibilitiesByRole: responsibilities,
      });

      // Insert any initial checklist items created
      initialChecklists.forEach((itemText) => {
        addChecklistItem(nextId, itemText, ownerRoleId);
      });

      // Add link if selected
      if (predecessorTaskId) {
        addTaskLink({
          sourceTaskId: predecessorTaskId,
          targetTaskId: nextId,
          linkType: 'DEPENDENCY',
        });
      }
      if (successorTaskId) {
        addTaskLink({
          sourceTaskId: nextId,
          targetTaskId: successorTaskId,
          linkType: 'DEPENDENCY',
        });
      }
    }

    closeTaskForm();
  };

  const categories: TaskCategory[] = [
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

  const activeParticipants = Array.from(new Set([ownerRoleId, ...collaboratorRoleIds]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingTask ? `Chỉnh sửa công việc: ${editingTask.id}` : 'Thêm công việc mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Khởi tạo công việc và xác định vai trò cầm chính, phối hợp rõ ràng
            </p>
          </div>
          <button
            onClick={closeTaskForm}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Tên công việc & Nhóm */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tên công việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nghiên cứu đối thủ trực tiếp trên Shopee..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nhóm công việc
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Vừa</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn cấp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hạn chót (Deadline)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* PHÂN CÔNG VAI TRÒ (Cầm chính, Phối hợp, Chốt) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Phân công vai trò cốt lõi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cầm chính */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cầm chính (Owner Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ownerRoleId}
                  onChange={(e) => {
                    const newOwner = Number(e.target.value) as RoleId;
                    setOwnerRoleId(newOwner);
                    setCollaboratorRoleIds(collaboratorRoleIds.filter((r) => r !== newOwner));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((r) => {
                    const person = people.find((p) => p.roleId === r.id && p.isPrimary);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.id === 1 ? '🔵' : r.id === 2 ? '🟣' : r.id === 3 ? '🟢' : '🟠'} {r.name}{' '}
                        ({person?.fullName})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Người chốt */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Người chốt duyệt (Tùy chọn)
                </label>
                <select
                  value={approverRoleId || ''}
                  onChange={(e) =>
                    setApproverRoleId(e.target.value ? (Number(e.target.value) as RoleId) : undefined)
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không yêu cầu duyệt riêng</option>
                  {roles.map((r) => {
                    const person = people.find((p) => p.roleId === r.id && p.isPrimary);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} ({person?.fullName})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Phối hợp (Multi-select pills) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Các role phối hợp trực tiếp:
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const isOwner = r.id === ownerRoleId;
                  const isCollab = collaboratorRoleIds.includes(r.id);
                  const person = people.find((p) => p.roleId === r.id && p.isPrimary);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={isOwner}
                      onClick={() => toggleCollaborator(r.id)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium border transition ${
                        isOwner
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-500'
                          : isCollab
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {r.name} ({person?.shortName}) {isOwner && '(Cầm chính)'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI LÀM GÌ TRONG TASK NÀY? (Trách nhiệm từng role tham gia) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Phân công cụ thể: Ai làm phần việc gì?
            </label>
            <div className="space-y-2">
              {activeParticipants.map((rId) => {
                const role = roles.find((r) => r.id === rId);
                const person = people.find((p) => p.roleId === rId && p.isPrimary);
                return (
                  <div key={rId} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {role?.name} ({person?.shortName}):
                    </span>
                    <input
                      type="text"
                      placeholder={`Phần việc của ${role?.name}...`}
                      value={responsibilities[rId] || ''}
                      onChange={(e) =>
                        setResponsibilities({ ...responsibilities, [rId]: e.target.value })
                      }
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mô tả & Hướng dẫn */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mô tả chi tiết công việc
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nội dung, bối cảnh và mục đích..."
                rows={2}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Đầu vào (Mỗi dòng 1 mục)
                </label>
                <textarea
                  value={inputsText}
                  onChange={(e) => setInputsText(e.target.value)}
                  placeholder="Dữ liệu từ sàn, tài liệu yêu cầu..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kết quả đầu ra (Mỗi dòng 1 mục)
                </label>
                <textarea
                  value={outputsText}
                  onChange={(e) => setOutputsText(e.target.value)}
                  placeholder="Bảng tính từ khóa, video demo..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tiêu chuẩn hoàn thành (Definition of Done)
              </label>
              <input
                type="text"
                value={definitionOfDone}
                onChange={(e) => setDefinitionOfDone(e.target.value)}
                placeholder="VD: Đã duyệt xong và được đăng tải chính thức..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Checklist ban đầu (cho task mới) */}
          {!editingTask && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Thêm danh sách kiểm tra (Checklist)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm mục kiểm tra..."
                  value={newChecklistInput}
                  onChange={(e) => setNewChecklistInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddInitialChecklist}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold rounded-lg"
                >
                  Thêm
                </button>
              </div>
              {initialChecklists.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {initialChecklists.map((txt, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                    >
                      <span>☐ {txt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInitialChecklist(idx)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* DEPENDENCY (Task trước / Task sau) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Công việc hoàn thành trước (Dependency)
              </label>
              <select
                value={predecessorTaskId}
                onChange={(e) => setPredecessorTaskId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="">Không có</option>
                {tasks
                  .filter((t) => !editingTask || t.id !== editingTask.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Công việc nhận kết quả sau (Successor)
              </label>
              <select
                value={successorTaskId}
                onChange={(e) => setSuccessorTaskId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="">Không có</option>
                {tasks
                  .filter((t) => !editingTask || t.id !== editingTask.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTaskForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {editingTask ? 'Cập nhật công việc' : 'Tạo công việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
