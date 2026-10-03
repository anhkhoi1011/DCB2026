import { Task, RoleId } from '../types';

export interface CalculatedPositions {
  roles: Record<RoleId, { x: number; y: number }>;
  tasks: Record<string, { x: number; y: number }>;
}

/**
 * Standard spatial coordinates for the 4 core roles around a central coordinate space.
 * Role 1 (Top), Role 2 (Left), Role 3 (Right), Role 4 (Bottom).
 */
export const DEFAULT_ROLE_POSITIONS: Record<RoleId, { x: number; y: number }> = {
  1: { x: 520, y: 120 },    // Top
  2: { x: 40, y: 560 },     // Left
  3: { x: 1060, y: 560 },   // Right
  4: { x: 520, y: 1020 },   // Bottom
};

/**
 * Categorizes a task into its relationship signature zone:
 * e.g. "1" (private 1), "2", "3", "4", "1-2", "1-3", "1-4", "2-3", "2-4", "3-4",
 * "1-2-3", "1-2-4", "1-3-4", "2-3-4", "1-2-3-4"
 */
export function getTaskSignature(task: Task): string {
  const roles = Array.from(new Set([task.ownerRoleId, ...(task.collaboratorRoleIds || [])])).sort((a, b) => a - b);
  return roles.join('-');
}

/**
 * Computes deterministic, collision-free grid positions for all tasks in their designated zones.
 */
export function calculateAutomaticLayout(tasks: Task[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  
  // Group tasks by their relationship signature
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const sig = getTaskSignature(task);
    if (!groups[sig]) groups[sig] = [];
    groups[sig].push(task);
  }

  const CARD_WIDTH = 240;
  const CARD_HEIGHT = 110;
  const GAP_X = 26;
  const GAP_Y = 24;

  // Helper to place a grid of cards starting from an origin point
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

  // 1. Role 1 Private: Top external zone
  if (groups['1']) {
    placeGrid(groups['1'], 240, -180, 3);
  }

  // 2. Role 2 Private: Far Left external zone
  if (groups['2']) {
    placeGrid(groups['2'], -500, 320, 2);
  }

  // 3. Role 3 Private: Far Right external zone
  if (groups['3']) {
    placeGrid(groups['3'], 1380, 220, 2);
  }

  // 4. Role 4 Private: Far Bottom external zone
  if (groups['4']) {
    placeGrid(groups['4'], 240, 1260, 3);
  }

  // 5. Shared 1 + 2: Top-Left diagonal zone
  if (groups['1-2']) {
    placeGrid(groups['1-2'], 120, 260, 2);
  }

  // 6. Shared 1 + 3: Top-Right diagonal zone
  if (groups['1-3']) {
    placeGrid(groups['1-3'], 820, 260, 2);
  }

  // 7. Shared 1 + 4: Center vertical corridor (offset slightly left of center)
  if (groups['1-4']) {
    placeGrid(groups['1-4'], 340, 480, 1);
  }

  // 8. Shared 2 + 3: Center horizontal corridor (offset slightly above center)
  if (groups['2-3']) {
    placeGrid(groups['2-3'], 400, 380, 2);
  }

  // 9. Shared 2 + 4: Bottom-Left diagonal zone
  if (groups['2-4']) {
    placeGrid(groups['2-4'], 120, 780, 2);
  }

  // 10. Shared 3 + 4: Bottom-Right diagonal zone
  if (groups['3-4']) {
    placeGrid(groups['3-4'], 820, 780, 2);
  }

  // 11. Shared 1 + 2 + 3: Upper-Center zone
  if (groups['1-2-3']) {
    placeGrid(groups['1-2-3'], 480, 320, 2);
  }

  // 12. Shared 1 + 2 + 4: Left-Center zone
  if (groups['1-2-4']) {
    placeGrid(groups['1-2-4'], 320, 640, 1);
  }

  // 13. Shared 1 + 3 + 4: Right-Center zone
  if (groups['1-3-4']) {
    placeGrid(groups['1-3-4'], 760, 640, 1);
  }

  // 14. Shared 2 + 3 + 4: Lower-Center zone
  if (groups['2-3-4']) {
    placeGrid(groups['2-3-4'], 460, 840, 2);
  }

  // 15. Shared all 4 [1-2-3-4]: Exact Core Center
  if (groups['1-2-3-4']) {
    placeGrid(groups['1-2-3-4'], 460, 560, 2);
  }

  // Handle any other rare custom signatures
  for (const [sig, taskList] of Object.entries(groups)) {
    if (
      ![
        '1', '2', '3', '4',
        '1-2', '1-3', '1-4', '2-3', '2-4', '3-4',
        '1-2-3', '1-2-4', '1-3-4', '2-3-4',
        '1-2-3-4',
      ].includes(sig)
    ) {
      placeGrid(taskList, 1400, 900, 2);
    }
  }

  return positions;
}
