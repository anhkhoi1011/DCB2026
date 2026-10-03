import { Role, Person, Task, ChecklistItem, TaskLink, AppSettings } from '../types';

export function parseSpreadsheetId(input: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  
  // Direct ID check (typically 44 chars alphanumeric with underscores/hyphens)
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  
  // URL matching
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

const REQUIRED_SHEETS = [
  'ROLES',
  'PEOPLE',
  'TASKS',
  'TASK_PARTICIPANTS',
  'CHECKLIST',
  'TASK_LINKS',
  'SETTINGS',
];

const SHEET_HEADERS: Record<string, string[]> = {
  ROLES: ['role_id', 'role_code', 'role_name', 'color', 'sort_order', 'active'],
  PEOPLE: ['person_id', 'full_name', 'short_name', 'role_id', 'avatar_url', 'is_primary', 'active', 'created_at', 'updated_at'],
  TASKS: [
    'task_id', 'title', 'category', 'owner_role_id', 'approver_role_id', 'status',
    'priority', 'description', 'how_to', 'definition_of_done', 'start_date', 'due_date',
    'progress', 'notes', 'created_at', 'updated_at', 'updated_by'
  ],
  TASK_PARTICIPANTS: ['id', 'task_id', 'role_id', 'relation_type', 'responsibility'],
  CHECKLIST: ['checklist_id', 'task_id', 'text', 'assignee_role_id', 'status', 'sort_order', 'created_at', 'updated_at'],
  TASK_LINKS: ['link_id', 'source_task_id', 'target_task_id', 'link_type', 'label'],
  SETTINGS: ['key', 'value'],
};

// Requests an access token via Google Identity Services
export function requestGoogleAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK chưa được tải trên trình duyệt.'));
      return;
    }

    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Không nhận được mã xác thực access_token từ Google.'));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Lỗi khi khởi chạy Google OAuth'));
    }
  });
}

// Fetch spreadsheet metadata to check which sheets exist
export async function getSpreadsheetMetadata(spreadsheetId: string, accessToken: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Lỗi truy cập Google Sheets (${res.status})`);
  }

  const data = await res.json();
  const existingSheetTitles: string[] = (data.sheets || []).map((s: any) => s.properties?.title);
  return {
    existingSheetTitles,
    missingSheets: REQUIRED_SHEETS.filter((title) => !existingSheetTitles.includes(title)),
  };
}

// Automatically create missing sheets and initialize headers
export async function setupSpreadsheetStructure(spreadsheetId: string, accessToken: string) {
  const { missingSheets, existingSheetTitles } = await getSpreadsheetMetadata(spreadsheetId, accessToken);

  if (missingSheets.length > 0) {
    // Add missing sheets via batchUpdate
    const requests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
        },
      },
    }));

    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Không thể tạo các bảng tính con trên Google Sheet');
    }
  }

  // Populate headers for each required sheet
  const valueRanges = REQUIRED_SHEETS.map((sheetName) => ({
    range: `${sheetName}!A1:Z1`,
    values: [SHEET_HEADERS[sheetName]],
  }));

  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: valueRanges,
      }),
    }
  );

  if (!headerRes.ok) {
    const err = await headerRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Không thể khởi tạo tiêu đề cột trên Google Sheet');
  }

  return true;
}

// Push all state data into Google Sheets
export async function exportDataToSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  data: {
    roles: Role[];
    people: Person[];
    tasks: Task[];
    checklists: ChecklistItem[];
    taskLinks: TaskLink[];
    settings: AppSettings;
  }
) {
  // Clear old data rows first (A2:Z1000) for all sheets
  const clearPromises = REQUIRED_SHEETS.map((sheet) =>
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheet}!A2:Z1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
  await Promise.all(clearPromises);

  // Prepare rows for ROLES
  const roleRows = data.roles.map((r) => [
    r.id,
    r.code,
    r.name,
    r.colorName,
    r.sortOrder,
    r.active ? 'TRUE' : 'FALSE',
  ]);

  // Prepare rows for PEOPLE
  const peopleRows = data.people.map((p) => [
    p.id,
    p.fullName,
    p.shortName,
    p.roleId,
    p.avatarUrl || '',
    p.isPrimary ? 'TRUE' : 'FALSE',
    p.active ? 'TRUE' : 'FALSE',
    p.createdAt,
    p.updatedAt,
  ]);

  // Prepare rows for TASKS
  const taskRows = data.tasks.map((t) => [
    t.id,
    t.title,
    t.category,
    t.ownerRoleId,
    t.approverRoleId || '',
    t.status,
    t.priority,
    t.description,
    t.howTo || '',
    t.definitionOfDone || '',
    t.startDate || '',
    t.dueDate || '',
    t.manualProgress || 0,
    t.notes || '',
    t.createdAt,
    t.updatedAt,
    t.updatedBy || '',
  ]);

  // Prepare rows for TASK_PARTICIPANTS
  const participantRows: any[] = [];
  data.tasks.forEach((t) => {
    // Owner
    participantRows.push([
      `part-${t.id}-owner`,
      t.id,
      t.ownerRoleId,
      'OWNER',
      t.responsibilitiesByRole[t.ownerRoleId] || '',
    ]);
    // Collaborators
    (t.collaboratorRoleIds || []).forEach((cRole) => {
      participantRows.push([
        `part-${t.id}-collab-${cRole}`,
        t.id,
        cRole,
        'COLLABORATOR',
        t.responsibilitiesByRole[cRole] || '',
      ]);
    });
    // Approver if distinct
    if (t.approverRoleId && t.approverRoleId !== t.ownerRoleId && !(t.collaboratorRoleIds || []).includes(t.approverRoleId)) {
      participantRows.push([
        `part-${t.id}-approver-${t.approverRoleId}`,
        t.id,
        t.approverRoleId,
        'APPROVER',
        t.responsibilitiesByRole[t.approverRoleId] || '',
      ]);
    }
  });

  // Prepare rows for CHECKLIST
  const checklistRows = data.checklists.map((c) => [
    c.id,
    c.taskId,
    c.text,
    c.assigneeRoleId || '',
    c.completed ? 'DONE' : 'NOT_DONE',
    c.sortOrder,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);

  // Prepare rows for TASK_LINKS
  const linkRows = data.taskLinks.map((l) => [
    l.id,
    l.sourceTaskId,
    l.targetTaskId,
    l.linkType,
    l.label || '',
  ]);

  // Prepare rows for SETTINGS
  const settingRows = [
    ['projectName', data.settings.projectName],
    ['teamName', data.settings.teamName],
    ['lastSynced', new Date().toISOString()],
  ];

  const updateBatch = [
    { range: 'ROLES!A2', values: roleRows },
    { range: 'PEOPLE!A2', values: peopleRows },
    { range: 'TASKS!A2', values: taskRows },
    { range: 'TASK_PARTICIPANTS!A2', values: participantRows },
    { range: 'CHECKLIST!A2', values: checklistRows },
    { range: 'TASK_LINKS!A2', values: linkRows },
    { range: 'SETTINGS!A2', values: settingRows },
  ].filter((item) => item.values.length > 0);

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateBatch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Lỗi khi cập nhật dữ liệu lên Google Sheets');
  }

  return true;
}

// Pull data from Google Sheets into local state
export async function importDataFromSpreadsheet(spreadsheetId: string, accessToken: string) {
  const ranges = REQUIRED_SHEETS.map((sheet) => `${sheet}!A2:Z1000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${ranges
    .map((r) => `ranges=${encodeURIComponent(r)}`)
    .join('&')}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Lỗi khi tải dữ liệu từ Google Sheets');
  }

  const data = await res.json();
  const valueRanges: any[] = data.valueRanges || [];

  const getSheetValues = (sheetName: string): any[][] => {
    const found = valueRanges.find((vr) => vr.range && vr.range.startsWith(`'${sheetName}'`) || vr.range.startsWith(`${sheetName}!`));
    return found?.values || [];
  };

  // Parse ROLES
  const roleRows = getSheetValues('ROLES');
  const roles: Role[] = roleRows
    .filter((r) => r[0])
    .map((r) => ({
      id: Number(r[0]) as any,
      code: r[1] || `ROLE_${r[0]}`,
      name: r[2] || `ROLE ${r[0]}`,
      colorName: (r[3] as any) || 'blue',
      hexColor: r[3] === 'purple' ? '#7C3AED' : r[3] === 'green' ? '#059669' : r[3] === 'orange' ? '#EA580C' : '#2563EB',
      lightBg: '',
      badgeBg: '',
      badgeText: '',
      borderLight: '',
      generalDuties: [],
      sortOrder: Number(r[4]) || 1,
      active: r[5] === 'TRUE',
    }));

  // Parse PEOPLE
  const peopleRows = getSheetValues('PEOPLE');
  const people: Person[] = peopleRows
    .filter((p) => p[0])
    .map((p) => ({
      id: p[0],
      fullName: p[1] || 'Thành viên',
      shortName: p[2] || (p[1] ? p[1].split(' ').pop() : 'TV'),
      roleId: Number(p[3]) as any,
      avatarUrl: p[4] || undefined,
      isPrimary: p[5] === 'TRUE',
      active: p[6] === 'TRUE',
      createdAt: p[7] || new Date().toISOString(),
      updatedAt: p[8] || new Date().toISOString(),
    }));

  // Parse TASK_PARTICIPANTS
  const partRows = getSheetValues('TASK_PARTICIPANTS');
  const taskPartMap: Record<string, { collabs: number[]; approver?: number; responsibilities: Record<number, string> }> = {};
  partRows.forEach((row) => {
    const taskId = row[1];
    const roleId = Number(row[2]);
    const relationType = row[3];
    const resp = row[4];
    if (!taskId || !roleId) return;
    if (!taskPartMap[taskId]) {
      taskPartMap[taskId] = { collabs: [], responsibilities: {} };
    }
    if (resp) taskPartMap[taskId].responsibilities[roleId] = resp;
    if (relationType === 'COLLABORATOR') {
      taskPartMap[taskId].collabs.push(roleId);
    } else if (relationType === 'APPROVER') {
      taskPartMap[taskId].approver = roleId;
    }
  });

  // Parse TASKS
  const taskRows = getSheetValues('TASKS');
  const tasks: Task[] = taskRows
    .filter((t) => t[0])
    .map((t) => {
      const taskId = t[0];
      const ownerRoleId = Number(t[3]) as any;
      const partInfo = taskPartMap[taskId] || { collabs: [], responsibilities: {} };
      const collaboratorRoleIds = partInfo.collabs as any;
      const participantRoleIds = Array.from(new Set([ownerRoleId, ...collaboratorRoleIds])) as any;

      return {
        id: taskId,
        title: t[1] || 'Công việc không tên',
        category: (t[2] as any) || 'Kế hoạch',
        ownerRoleId,
        approverRoleId: t[4] ? (Number(t[4]) as any) : partInfo.approver as any,
        collaboratorRoleIds,
        participantRoleIds,
        status: (t[5] as any) || 'NOT_STARTED',
        priority: (t[6] as any) || 'MEDIUM',
        description: t[7] || '',
        howTo: t[8] || undefined,
        definitionOfDone: t[9] || undefined,
        startDate: t[10] || undefined,
        dueDate: t[11] || undefined,
        manualProgress: Number(t[12]) || 0,
        notes: t[13] || undefined,
        responsibilitiesByRole: partInfo.responsibilities as any,
        createdAt: t[14] || new Date().toISOString(),
        updatedAt: t[15] || new Date().toISOString(),
        updatedBy: t[16] || undefined,
      };
    });

  // Parse CHECKLIST
  const checkRows = getSheetValues('CHECKLIST');
  const checklists: ChecklistItem[] = checkRows
    .filter((c) => c[0])
    .map((c) => ({
      id: c[0],
      taskId: c[1],
      text: c[2] || '',
      assigneeRoleId: c[3] ? (Number(c[3]) as any) : undefined,
      completed: c[4] === 'DONE' || c[4] === 'TRUE',
      sortOrder: Number(c[5]) || 1,
    }));

  // Parse TASK_LINKS
  const linkRows = getSheetValues('TASK_LINKS');
  const taskLinks: TaskLink[] = linkRows
    .filter((l) => l[0])
    .map((l) => ({
      id: l[0],
      sourceTaskId: l[1],
      targetTaskId: l[2],
      linkType: (l[3] as any) || 'DEPENDENCY',
      label: l[4] || undefined,
    }));

  return {
    roles: roles.length > 0 ? roles : undefined,
    people: people.length > 0 ? people : undefined,
    tasks: tasks.length > 0 ? tasks : undefined,
    checklists: checklists.length > 0 ? checklists : undefined,
    taskLinks: taskLinks.length > 0 ? taskLinks : undefined,
  };
}
