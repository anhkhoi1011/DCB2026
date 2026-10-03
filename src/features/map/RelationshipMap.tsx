import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { useAppStore } from '../../store/useAppStore';
import { RoleNode } from './RoleNode';
import { TaskNode } from './TaskNode';
import { RelationshipEdge } from './RelationshipEdge';
import { MapToolbar } from './MapToolbar';
import { MapLegend } from './MapLegend';
import { DEFAULT_ROLE_POSITIONS, calculateAutomaticLayout } from '../../utils/layout';
import { RoleId } from '../../types';
import { X, User } from 'lucide-react';

const nodeTypes = {
  roleNode: RoleNode,
  taskNode: TaskNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

export const RelationshipMap: React.FC = () => {
  const {
    roles,
    people,
    tasks,
    taskLinks,
    selectedTaskId,
    selectedRoleId,
    setSelectedTaskId,
    setSelectedRoleId,
    clearSelection,
    settings,
    updateTaskPosition,
  } = useAppStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: ESC to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  // Compute calculated positions
  const autoPositions = useMemo(() => calculateAutomaticLayout(tasks), [tasks]);

  // Set of Active Role IDs in the current selection
  const activeRoleIds = useMemo<Set<RoleId>>(() => {
    const set = new Set<RoleId>();
    if (selectedRoleId) {
      set.add(selectedRoleId);
    } else if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        set.add(task.ownerRoleId);
        (task.collaboratorRoleIds || []).forEach((r) => set.add(r));
        if (task.approverRoleId) set.add(task.approverRoleId);
      }
    }
    return set;
  }, [selectedRoleId, selectedTaskId, tasks]);

  // Set of Active Task IDs in current selection
  const activeTaskIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedTaskId) {
      set.add(selectedTaskId);
      // If dependency tracing is ON, include direct predecessors and successors
      if (settings.showDependenciesOnTrace) {
        taskLinks.forEach((link) => {
          if (link.targetTaskId === selectedTaskId) set.add(link.sourceTaskId);
          if (link.sourceTaskId === selectedTaskId) set.add(link.targetTaskId);
        });
      }
    } else if (selectedRoleId) {
      // All tasks where selectedRoleId is owner or collaborator
      tasks.forEach((t) => {
        if (t.ownerRoleId === selectedRoleId || (t.collaboratorRoleIds || []).includes(selectedRoleId)) {
          set.add(t.id);
        }
      });
    }
    return set;
  }, [selectedTaskId, selectedRoleId, tasks, taskLinks, settings.showDependenciesOnTrace]);

  const hasSelection = selectedRoleId !== null || selectedTaskId !== null;

  // Build XYFlow Nodes
  const nodes = useMemo<Node[]>(() => {
    const roleNodes: Node[] = roles.map((role) => {
      const pos = DEFAULT_ROLE_POSITIONS[role.id];
      const isDimmed = hasSelection && !activeRoleIds.has(role.id);
      const isHighlighted = activeRoleIds.has(role.id);

      return {
        id: `role-${role.id}`,
        type: 'roleNode',
        position: pos,
        data: {
          roleId: role.id,
          isDimmed,
          isHighlighted,
        },
        draggable: false, // Core roles remain anchor landmarks
      };
    });

    const taskNodes: Node[] = tasks.map((task) => {
      const pos = task.customPosition || autoPositions[task.id] || { x: 500, y: 500 };
      const isSelected = selectedTaskId === task.id;
      const isDimmed = hasSelection && !activeTaskIds.has(task.id);
      const isHighlighted = activeTaskIds.has(task.id);

      return {
        id: `task-${task.id}`,
        type: 'taskNode',
        position: pos,
        data: {
          task,
          isDimmed,
          isHighlighted,
          isSelected,
        },
        draggable: !settings.isLockedLayout,
      };
    });

    return [...roleNodes, ...taskNodes];
  }, [roles, tasks, autoPositions, activeRoleIds, activeTaskIds, hasSelection, selectedTaskId, settings.isLockedLayout]);

  // Build XYFlow Edges
  const edges = useMemo<Edge[]>(() => {
    const edgeList: Edge[] = [];

    // 1. Responsibility Edges (Role -> Task)
    tasks.forEach((task) => {
      // Owner edge
      const isOwnerDimmed =
        hasSelection && !(activeRoleIds.has(task.ownerRoleId) && activeTaskIds.has(task.id));
      const isOwnerHighlighted =
        activeRoleIds.has(task.ownerRoleId) && activeTaskIds.has(task.id);

      edgeList.push({
        id: `edge-owner-${task.ownerRoleId}-${task.id}`,
        source: `role-${task.ownerRoleId}`,
        target: `task-${task.id}`,
        type: 'relationshipEdge',
        data: {
          relationshipType: 'OWNER',
          roleId: task.ownerRoleId,
          isDimmed: isOwnerDimmed,
          isHighlighted: isOwnerHighlighted,
          label: isOwnerHighlighted ? 'Cầm chính' : undefined,
        },
      });

      // Collaborator edges
      (task.collaboratorRoleIds || []).forEach((cRole) => {
        const isCollabDimmed =
          hasSelection && !(activeRoleIds.has(cRole) && activeTaskIds.has(task.id));
        const isCollabHighlighted =
          activeRoleIds.has(cRole) && activeTaskIds.has(task.id);

        edgeList.push({
          id: `edge-collab-${cRole}-${task.id}`,
          source: `role-${cRole}`,
          target: `task-${task.id}`,
          type: 'relationshipEdge',
          data: {
            relationshipType: 'COLLABORATOR',
            roleId: cRole,
            isDimmed: isCollabDimmed,
            isHighlighted: isCollabHighlighted,
            label: isCollabHighlighted ? 'Phối hợp' : undefined,
          },
        });
      });

      // Approver edge (if approver is not owner or collab already)
      if (
        task.approverRoleId &&
        task.approverRoleId !== task.ownerRoleId &&
        !(task.collaboratorRoleIds || []).includes(task.approverRoleId)
      ) {
        const isApprDimmed =
          hasSelection && !(activeRoleIds.has(task.approverRoleId) && activeTaskIds.has(task.id));
        const isApprHighlighted =
          activeRoleIds.has(task.approverRoleId) && activeTaskIds.has(task.id);

        edgeList.push({
          id: `edge-approver-${task.approverRoleId}-${task.id}`,
          source: `role-${task.approverRoleId}`,
          target: `task-${task.id}`,
          type: 'relationshipEdge',
          data: {
            relationshipType: 'APPROVER',
            roleId: task.approverRoleId,
            isDimmed: isApprDimmed,
            isHighlighted: isApprHighlighted,
            label: isApprHighlighted ? 'Chốt' : undefined,
          },
        });
      }
    });

    // 2. Dependency / Handoff / Feedback Edges (Task -> Task)
    taskLinks.forEach((link) => {
      const isLinkActive =
        activeTaskIds.has(link.sourceTaskId) && activeTaskIds.has(link.targetTaskId);
      const isLinkDimmed = hasSelection && !isLinkActive;

      edgeList.push({
        id: `link-${link.id}`,
        source: `task-${link.sourceTaskId}`,
        target: `task-${link.targetTaskId}`,
        type: 'relationshipEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: link.linkType === 'FEEDBACK' ? '#ec4899' : '#64748b',
          width: 14,
          height: 14,
        },
        data: {
          relationshipType: link.linkType,
          isDimmed: isLinkDimmed,
          isHighlighted: isLinkActive,
          label: isLinkActive ? link.label || link.linkType : undefined,
        },
      });
    });

    return edgeList;
  }, [tasks, taskLinks, activeRoleIds, activeTaskIds, hasSelection]);

  // Handle task drag stop to save position
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (node.id.startsWith('task-')) {
        const taskId = node.id.replace('task-', '');
        updateTaskPosition(taskId, node.position);
      }
    },
    [updateTaskPosition]
  );

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Determine current active selection label for top breadcrumb
  let activeSelectionLabel = '';
  if (selectedTaskId) {
    const t = tasks.find((item) => item.id === selectedTaskId);
    if (t) activeSelectionLabel = `Công việc: [${t.id}] ${t.title}`;
  } else if (selectedRoleId) {
    const r = roles.find((item) => item.id === selectedRoleId);
    const p = people.find((item) => item.roleId === selectedRoleId && item.isPrimary);
    if (r) activeSelectionLabel = `Vai trò: ${r.name} (${p?.fullName})`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      {/* Top Breadcrumb Selection Banner */}
      {activeSelectionLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-white/95 dark:bg-slate-900/95 border border-blue-500/50 rounded-full shadow-lg backdrop-blur-md animate-fade-in text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
            {activeSelectionLabel}
          </span>
          <button
            onClick={clearSelection}
            className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            title="Xóa lựa chọn (Phím ESC)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Toolbar */}
      <MapToolbar
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Map Legend */}
      <MapLegend />

      {/* Main Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onPaneClick={clearSelection}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          className="opacity-40 dark:opacity-25"
        />
        <Controls showInteractive={false} position="bottom-right" className="!shadow-md" />
      </ReactFlow>
    </div>
  );
};
