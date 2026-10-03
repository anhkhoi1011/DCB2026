import { Role, Person, Task, TaskLink, AppSettings } from '../types';

export function parseSpreadsheetId(input: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

// 6 active tabs in V2 (CHECKLIST is removed)
const REQUIRED_SHEETS = [
  'ROLES',
  'PEOPLE',
  'TASKS',
  'TASK_PARTICIPANTS',
  'TASK_LINKS',
  'SETTINGS',
];

const SHEET_HEADERS: Record<string, string[]> = {
  ROLES: ['role_id', 'role_code', 'role_name', 'color', 'sort_order', 'active'],
  PEOPLE: ['person_id', 'full_name', 'short_name', 'role_id', 'avatar_url', 'is_primary', 'active', 'created_at', 'updated_at'],
  TASKS: [
    'task_id', 'title', 'category', 'owner_person_id', 'owner_role_id',
    'approver_person_id', 'approver_role_id', 'status', 'priority',
    'due_at', 'output', 'note', 'created_at', 'updated_at'
  ],
  TASK_PARTICIPANTS: ['id', 'task_id', 'person_id', 'role_id', 'relation_type', 'responsibility'],
  TASK_LINKS: ['link_id', 'source_task_id', 'target_task_id', 'link_type', 'label'],
  SETTINGS: ['key', 'value'],
};

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
    hasLegacyChecklist: existingSheetTitles.includes('CHECKLIST'),
  };
}

export async function setupSpreadsheetStructure(spreadsheetId: string, accessToken: string) {
  const { missingSheets } = await getSpreadsheetMetadata(spreadsheetId, accessToken);

  if (missingSheets.length > 0) {
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

export async function exportDataToSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  data: {
    roles: Role[];
    people: Person[];
    tasks: Task[];
    taskLinks: TaskLink[];
    settings: AppSettings;
  }
) {
  // Clear old data rows for the 6 required sheets
  const clearPromises = REQUIRED_SHEETS.map((sheet) =>
    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheet}!A2:Z1000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  );
  await Promise.all(clearPromises);

  // 1. ROLES
  const roleRows = data.roles.map((r) => [
    r.id,
    r.code,
    r.name,
    r.colorName,
    r.sortOrder,
    r.active ? 'TRUE' : 'FALSE',
  ]);

  // 2. PEOPLE
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

  // 3. TASKS
  const taskRows = data.tasks.map((t) => [
    t.id,
    t.title,
    t.category || '',
    t.ownerPersonId,
    t.ownerRoleId,
    t.approverPersonId || '',
    t.approverRoleId || '',
    t.status,
    t.priority || 'MEDIUM',
    t.dueAt || '',
    t.output,
    t.note || '',
    t.createdAt,
    t.updatedAt,
  ]);

  // 4. TASK_PARTICIPANTS
  const participantRows: any[] = [];
  data.tasks.forEach((t) => {
    // Owner
    participantRows.push([
      `part-${t.id}-owner`,
      t.id,
      t.ownerPersonId,
      t.ownerRoleId,
      'OWNER',
      'Cầm chính nhiệm vụ',
    ]);
    // Collaborators
    (t.collaborators || []).forEach((c) => {
      participantRows.push([
        `part-${t.id}-collab-${c.personId}`,
        t.id,
        c.personId,
        c.roleId,
        'COLLABORATOR',
        c.responsibility || '',
      ]);
    });
    // Approver if specified
    if (t.approverPersonId && t.approverRoleId && t.approverPersonId !== t.ownerPersonId) {
      participantRows.push([
        `part-${t.id}-approver-${t.approverPersonId}`,
        t.id,
        t.approverPersonId,
        t.approverRoleId,
        'APPROVER',
        'Phê duyệt kết quả',
      ]);
    }
  });

  // 5. TASK_LINKS
  const linkRows = data.taskLinks.map((l) => [
    l.id,
    l.sourceTaskId,
    l.targetTaskId,
    l.linkType,
    l.label || '',
  ]);

  // 6. SETTINGS
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
    const found = valueRanges.find(
      (vr) => (vr.range && vr.range.startsWith(`'${sheetName}'`)) || (vr.range && vr.range.startsWith(`${sheetName}!`))
    );
    return found?.values || [];
  };

  // 1. ROLES
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

  // 2. PEOPLE
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

  // 3. TASK_PARTICIPANTS
  const partRows = getSheetValues('TASK_PARTICIPANTS');
  const taskPartMap: Record<string, { collabs: Array<{ personId: string; roleId: any; responsibility?: string }>; approverPersonId?: string; approverRoleId?: any }> = {};
  partRows.forEach((row) => {
    const taskId = row[1];
    const personId = row[2];
    const roleId = Number(row[3]);
    const relationType = row[4];
    const responsibility = row[5];
    if (!taskId || !roleId) return;

    if (!taskPartMap[taskId]) {
      taskPartMap[taskId] = { collabs: [] };
    }

    if (relationType === 'COLLABORATOR') {
      taskPartMap[taskId].collabs.push({ personId, roleId, responsibility });
    } else if (relationType === 'APPROVER') {
      taskPartMap[taskId].approverPersonId = personId;
      taskPartMap[taskId].approverRoleId = roleId;
    }
  });

  // 4. TASKS
  const taskRows = getSheetValues('TASKS');
  const tasks: Task[] = taskRows
    .filter((t) => t[0])
    .map((t) => {
      const taskId = t[0];
      const ownerRoleId = Number(t[4]) as any;
      const partInfo = taskPartMap[taskId] || { collabs: [] };

      return {
        id: taskId,
        title: t[1] || 'Công việc không tên',
        category: t[2] || undefined,
        ownerPersonId: t[3] || `p-${ownerRoleId}`,
        ownerRoleId,
        approverPersonId: t[5] || partInfo.approverPersonId,
        approverRoleId: t[6] ? (Number(t[6]) as any) : partInfo.approverRoleId,
        collaborators: partInfo.collabs,
        status: (t[7] as any) || 'NOT_STARTED',
        priority: (t[8] as any) || 'MEDIUM',
        dueAt: t[9] || null,
        output: t[10] || '',
        note: t[11] || undefined,
        createdAt: t[12] || new Date().toISOString(),
        updatedAt: t[13] || new Date().toISOString(),
      };
    });

  // 5. TASK_LINKS
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
    taskLinks: taskLinks.length > 0 ? taskLinks : undefined,
  };
}
