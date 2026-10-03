import { Task, RoleId } from '../types';

export interface CalculatedPositions {
  roles: Record<RoleId, { x: number; y: number }>;
  tasks: Record<string, { x: number; y: number }>;
}

export const DEFAULT_ROLE_POSITIONS: Record<RoleId, { x: number; y: number }> = {
  1: { x: 500, y: 0 },       // Top Anchor
  2: { x: -160, y: 740 },    // Left Anchor
  3: { x: 1300, y: 740 },    // Right Anchor
  4: { x: 500, y: 1560 },    // Bottom Anchor
};

export function getTaskSignature(task: Task): string {
  const collabRoleIds = (task.collaborators || []).map((c) => c.roleId);
  const roles = Array.from(new Set([task.ownerRoleId, ...collabRoleIds])).sort((a, b) => a - b);
  return roles.join('-');
}

export function calculateAutomaticLayout(tasks: Task[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const sig = getTaskSignature(task);
    if (!groups[sig]) groups[sig] = [];
    groups[sig].push(task);
  }

  const CARD_WIDTH = 200;
  const CARD_HEIGHT = 110;
  const GAP_X = 48; // ~40-50px
  const GAP_Y = 36; // ~30-40px

  const placeGrid = (
    taskList: Task[],
    startX: number,
    startY: number,
    cols: number = 2
  ) => {
    taskList.forEach((task, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions[task.id] = {
        x: startX + col * (CARD_WIDTH + GAP_X),
        y: startY + row * (CARD_HEIGHT + GAP_Y),
      };
    });
  };

  // 1. Role 1 Private: Top external zone (4 cols) - 104px gap to Role 1
  if (groups['1']) placeGrid(groups['1'], 172, -360, 4);

  // 2. Role 2 Private: Far Left external zone (2 cols) - 120px gap to Role 2
  if (groups['2']) placeGrid(groups['2'], -728, 680, 2);

  // 3. Role 3 Private: Far Right external zone (2 cols) - 120px gap to Role 3
  if (groups['3']) placeGrid(groups['3'], 1708, 680, 2);

  // 4. Role 4 Private: Far Bottom external zone (4 cols) - 100px gap to Role 4
  if (groups['4']) placeGrid(groups['4'], 172, 1770, 4);

  // 5. Shared 1 + 2 (CORE-17, Chọn SP chủ lực)
  if (groups['1-2']) placeGrid(groups['1-2'], 80, 360, 1);

  // 6. Shared 1 + 3
  if (groups['1-3']) placeGrid(groups['1-3'], 960, 240, 1);

  // 7. Shared 1 + 4
  if (groups['1-4']) placeGrid(groups['1-4'], -240, 400, 1);

  // 8. Shared 2 + 3
  if (groups['2-3']) placeGrid(groups['2-3'], 300, 380, 2);

  // 9. Shared 2 + 4
  if (groups['2-4']) placeGrid(groups['2-4'], -240, 1100, 1);

  // 10. Shared 3 + 4
  if (groups['3-4']) placeGrid(groups['3-4'], 1260, 1100, 1);

  // 11. Shared 1 + 2 + 3
  if (groups['1-2-3']) placeGrid(groups['1-2-3'], 300, 220, 2);

  // 12. Shared 1 + 2 + 4
  if (groups['1-2-4']) placeGrid(groups['1-2-4'], 80, 940, 1);

  // 13. Shared 1 + 3 + 4 (CORE-19, Triển khai chiến dịch)
  if (groups['1-3-4']) placeGrid(groups['1-3-4'], 880, 480, 1);

  // 14. Shared 2 + 3 + 4 (CORE-18, Hoàn thiện trang SP)
  if (groups['2-3-4']) placeGrid(groups['2-3-4'], 880, 940, 1);

  // 15. Shared all 4 [1-2-3-4] (CORE-20, Review & Tối ưu)
  if (groups['1-2-3-4']) placeGrid(groups['1-2-3-4'], 544, 740, 1);

  // Handle any fallback signatures
  for (const [sig, taskList] of Object.entries(groups)) {
    if (
      ![
        '1', '2', '3', '4',
        '1-2', '1-3', '1-4', '2-3', '2-4', '3-4',
        '1-2-3', '1-2-4', '1-3-4', '2-3-4',
        '1-2-3-4',
      ].includes(sig)
    ) {
      placeGrid(taskList, 1708, 980, 2);
    }
  }

  return positions;
}
