import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, Users, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { RoleId, TaskStatus, TaskPriority, TaskCategory, Task, TaskCollaborator } from '../../types';
import { TASK_TEMPLATES } from '../../data/taskTemplates';

export const TaskFormModal: React.FC = () => {
  const {
    isTaskFormOpen,
    editingTaskId,
    prefillFromTemplateId,
    closeTaskForm,
    tasks,
    roles,
    people,
    addTask,
    updateTask,
    taskLinks,
    addTaskLink,
  } = useAppStore();

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  // Primary Person helper for defaults
  const getPrimaryPersonForRole = (roleId: RoleId) => {
    return people.find((p) => p.roleId === roleId && p.isPrimary) || people.find((p) => p.roleId === roleId) || people[0];
  };

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Kế hoạch');
  const [ownerPersonId, setOwnerPersonId] = useState<string>('');
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([]);
  const [approverPersonId, setApproverPersonId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueAt, setDueAt] = useState('');
  const [output, setOutput] = useState('');
  const [note, setNote] = useState('');
  const [predecessorTaskId, setPredecessorTaskId] = useState<string>('');
  const [successorTaskId, setSuccessorTaskId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

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

  // Apply template prefill
  const applyTemplate = (templateId: string) => {
    const tpl = TASK_TEMPLATES.find((t) => t.templateId === templateId);
    if (!tpl) return;

    setTitle(tpl.title);
    setCategory(tpl.category);
    setOutput(tpl.suggestedOutput);

    const ownerPerson = getPrimaryPersonForRole(tpl.suggestedOwnerRoleId);
    if (ownerPerson) {
      setOwnerPersonId(ownerPerson.id);
    }

    const collabs: TaskCollaborator[] = (tpl.suggestedCollaboratorRoleIds || []).map((rId) => {
      const p = getPrimaryPersonForRole(rId);
      const resp = tpl.suggestedResponsibilitiesByRole ? tpl.suggestedResponsibilitiesByRole[rId] : '';
      return {
        personId: p ? p.id : `p-${rId}`,
        roleId: rId,
        responsibility: resp,
      };
    });
    setCollaborators(collabs);

    if (tpl.suggestedApproverRoleId) {
      const appr = getPrimaryPersonForRole(tpl.suggestedApproverRoleId);
      setApproverPersonId(appr ? appr.id : '');
    } else {
      setApproverPersonId('');
    }
  };

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategory(editingTask.category || 'Kế hoạch');
      setOwnerPersonId(editingTask.ownerPersonId);
      setCollaborators(editingTask.collaborators || []);
      setApproverPersonId(editingTask.approverPersonId || '');
      setStatus(editingTask.status);
      setPriority(editingTask.priority || 'MEDIUM');
      setDueAt(editingTask.dueAt || '');
      setOutput(editingTask.output || '');
      setNote(editingTask.note || '');

      // Incoming & Outgoing links
      const incoming = taskLinks.find((l) => l.targetTaskId === editingTask.id);
      setPredecessorTaskId(incoming ? incoming.sourceTaskId : '');

      const outgoing = taskLinks.find((l) => l.sourceTaskId === editingTask.id);
      setSuccessorTaskId(outgoing ? outgoing.targetTaskId : '');

      setSelectedTemplateId('');
    } else {
      // Defaults for new task
      const defaultOwner = getPrimaryPersonForRole(1);
      setTitle('');
      setCategory('Kế hoạch');
      setOwnerPersonId(defaultOwner ? defaultOwner.id : (people[0]?.id || 'p-1'));
      setCollaborators([]);
      setApproverPersonId('');
      setStatus('NOT_STARTED');
      setPriority('MEDIUM');
      setDueAt('');
      setOutput('');
      setNote('');
      setPredecessorTaskId('');
      setSuccessorTaskId('');

      if (prefillFromTemplateId) {
        setSelectedTemplateId(prefillFromTemplateId);
        applyTemplate(prefillFromTemplateId);
      } else {
        setSelectedTemplateId('');
      }
    }
  }, [editingTask, isTaskFormOpen, prefillFromTemplateId]);

  if (!isTaskFormOpen) return null;

  // Handle owner selection
  const handleOwnerChange = (personId: string) => {
    setOwnerPersonId(personId);
    // If owner was in collaborators, remove from collaborators
    setCollaborators((prev) => prev.filter((c) => c.personId !== personId));
  };

  // Toggle collaborator person
  const toggleCollaboratorPerson = (personId: string) => {
    if (personId === ownerPersonId) return;

    const person = people.find((p) => p.id === personId);
    if (!person) return;

    const exists = collaborators.some((c) => c.personId === personId);
    if (exists) {
      setCollaborators((prev) => prev.filter((c) => c.personId !== personId));
    } else {
      setCollaborators((prev) => [
        ...prev,
        {
          personId,
          roleId: person.roleId,
          responsibility: '',
        },
      ]);
    }
  };

  const updateCollaboratorResponsibility = (personId: string, responsibility: string) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.personId === personId ? { ...c, responsibility } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ownerPerson = people.find((p) => p.id === ownerPersonId);
    const ownerRoleId: RoleId = ownerPerson ? ownerPerson.roleId : 1;

    let approverRoleId: RoleId | undefined = undefined;
    if (approverPersonId) {
      const apprPerson = people.find((p) => p.id === approverPersonId);
      if (apprPerson) approverRoleId = apprPerson.roleId;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        category,
        ownerPersonId,
        ownerRoleId,
        collaborators,
        approverPersonId: approverPersonId || undefined,
        approverRoleId,
        status,
        priority,
        dueAt: dueAt || null,
        output: output.trim(),
        note: note.trim() || undefined,
      });

      // Update links if needed
      if (predecessorTaskId && predecessorTaskId !== editingTask.id) {
        const linkExists = taskLinks.some(
          (l) => l.sourceTaskId === predecessorTaskId && l.targetTaskId === editingTask.id
        );
        if (!linkExists) {
          addTaskLink({
            sourceTaskId: predecessorTaskId,
            targetTaskId: editingTask.id,
            linkType: 'DEPENDENCY',
            label: 'Cần hoàn thành trước',
          });
        }
      }

      if (successorTaskId && successorTaskId !== editingTask.id) {
        const linkExists = taskLinks.some(
          (l) => l.sourceTaskId === editingTask.id && l.targetTaskId === successorTaskId
        );
        if (!linkExists) {
          addTaskLink({
            sourceTaskId: editingTask.id,
            targetTaskId: successorTaskId,
            linkType: 'HANDOFF',
            label: 'Bàn giao kết quả',
          });
        }
      }
    } else {
      // New task
      const nextId = `TASK-${Date.now().toString(36).toUpperCase()}`;
      addTask({
        id: nextId,
        title: title.trim(),
        category,
        ownerPersonId,
        ownerRoleId,
        collaborators,
        approverPersonId: approverPersonId || undefined,
        approverRoleId,
        status,
        priority,
        dueAt: dueAt || null,
        output: output.trim() || 'Chưa bàn giao',
        note: note.trim() || undefined,
      });

      if (predecessorTaskId && predecessorTaskId !== nextId) {
        addTaskLink({
          sourceTaskId: predecessorTaskId,
          targetTaskId: nextId,
          linkType: 'DEPENDENCY',
          label: 'Cần hoàn thành trước',
        });
      }

      if (successorTaskId && successorTaskId !== nextId) {
        addTaskLink({
          sourceTaskId: nextId,
          targetTaskId: successorTaskId,
          linkType: 'HANDOFF',
          label: 'Bàn giao kết quả',
        });
      }
    }

    closeTaskForm();
  };

  const getRoleDot = (roleId: RoleId) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingTask ? `Chỉnh Sửa Công Việc (${editingTask.id})` : 'Thêm Công Việc Mới'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân công rõ người cầm chính, người phối hợp, hạn hoàn thành và output cần bàn giao
            </p>
          </div>
          <button
            onClick={closeTaskForm}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector Bar (for new tasks) */}
        {!editingTask && (
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-semibold">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Gợi ý từ thư viện 82 mẫu chuẩn DBC:</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                if (e.target.value) applyTemplate(e.target.value);
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-medium cursor-pointer"
            >
              <option value="">-- Tự nhập hoặc chọn mẫu --</option>
              {TASK_TEMPLATES.map((tpl) => (
                <option key={tpl.templateId} value={tpl.templateId}>
                  [{tpl.templateId.replace('TPL-', '')}] {tpl.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên công việc <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nghiên cứu thị trường mục tiêu và đối thủ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nhóm</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value="NOT_STARTED">Chưa làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
                <option value="BLOCKED">Bị vướng</option>
                <option value="ON_HOLD">Tạm dừng</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Vừa</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* People Assignment Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Phân Công Thành Viên Cụ Thể</span>
            </div>

            {/* Owner (Cầm chính - Select Person) */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <span>Cầm chính (Chịu trách nhiệm chính):</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {people.map((p) => {
                  const isSelected = p.id === ownerPersonId;
                  const role = roles.find((r) => r.id === p.roleId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleOwnerChange(p.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${getRoleDot(p.roleId)}`} />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                          {p.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          0{p.roleId} - {role?.code}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collaborators (Phối hợp - Multi-select Person) */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phối hợp thực hiện (Chọn các thành viên phối hợp):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {people
                  .filter((p) => p.id !== ownerPersonId)
                  .map((p) => {
                    const isSelected = collaborators.some((c) => c.personId === p.id);
                    const role = roles.find((r) => r.id === p.roleId);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleCollaboratorPerson(p.id)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 opacity-80'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${getRoleDot(p.roleId)}`} />
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                            {p.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            0{p.roleId} - {role?.code}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Responsibilities input for collaborators */}
              {collaborators.length > 0 && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Phần việc cụ thể của từng người phối hợp:
                  </div>
                  {collaborators.map((c) => {
                    const person = people.find((p) => p.id === c.personId);
                    return (
                      <div key={c.personId} className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 w-28 truncate text-[11px]">
                          {person?.shortName || person?.fullName}:
                        </span>
                        <input
                          type="text"
                          placeholder="VD: Cung cấp số liệu, thiết kế ảnh, quay clip..."
                          value={c.responsibility || ''}
                          onChange={(e) => updateCollaboratorResponsibility(c.personId, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Approver (Người chốt - Optional Person) */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Người chốt / Duyệt nghiệm thu (Tùy chọn):</span>
              </label>
              <select
                value={approverPersonId}
                onChange={(e) => setApproverPersonId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Không yêu cầu người duyệt riêng --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (Vai trò 0{p.roleId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline & Output Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Due Date (dueAt) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hạn hoàn thành (Deadline)
              </label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>

            {/* Output */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Output cần bàn giao <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: File Excel phân tích đối thủ, link trang sản phẩm..."
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Dependencies / Task liên quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3 text-amber-500" />
                <span>Task cần hoàn thành trước (Tiền nhiệm)</span>
              </label>
              <select
                value={predecessorTaskId}
                onChange={(e) => setPredecessorTaskId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Không có --</option>
                {tasks
                  .filter((t) => t.id !== editingTaskId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-blue-500" />
                <span>Bàn giao tiếp theo cho (Kế nhiệm)</span>
              </label>
              <select
                value={successorTaskId}
                onChange={(e) => setSuccessorTaskId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Không có --</option>
                {tasks
                  .filter((t) => t.id !== editingTaskId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú thêm</label>
            <textarea
              rows={2}
              placeholder="Ghi chú nội bộ, yêu cầu lưu ý đặc biệt..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTaskForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
            >
              {editingTask ? 'Lưu thay đổi' : 'Tạo công việc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
