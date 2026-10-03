import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { useAppStore } from '../../store/useAppStore';
import { useResolvedTheme } from '../../hooks/useResolvedTheme';
import { RoleNode } from './RoleNode';
import { TaskNode } from './TaskNode';
import { RelationshipEdge } from './RelationshipEdge';
import { MapToolbar } from './MapToolbar';
import { MapLegend } from './MapLegend';
import { DEFAULT_ROLE_POSITIONS, calculateAutomaticLayout } from '../../utils/layout';
import { RoleId } from '../../types';

const nodeTypes = {
  role: RoleNode,
  task: TaskNode,
  roleNode: RoleNode,
  taskNode: TaskNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
  relationship: RelationshipEdge,
  default: RelationshipEdge,
};

const RelationshipMapContent: React.FC = () => {
  const {
    roles,
    people,
    tasks,
    taskLinks,
    selectedTaskId,
    selectedRoleId,
    perspectivePersonId,
    clearSelection,
    settings,
    updateTaskPosition,
  } = useAppStore();

  const { resolvedTheme } = useResolvedTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const autoPositions = useMemo(() => calculateAutomaticLayout(tasks), [tasks]);

  // Active Role IDs
  const activeRoleIds = useMemo<Set<RoleId>>(() => {
    const set = new Set<RoleId>();
    if (selectedRoleId) {
      set.add(selectedRoleId);
    } else if (perspectivePersonId) {
      const person = people.find((p) => p.id === perspectivePersonId);
      if (person) set.add(person.roleId);
    } else if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        set.add(task.ownerRoleId);
        (task.collaborators || []).forEach((c) => set.add(c.roleId));
        if (task.approverRoleId) set.add(task.approverRoleId);
      }
    }
    return set;
  }, [selectedRoleId, perspectivePersonId, selectedTaskId, tasks, people]);

  // Active Task IDs
  const activeTaskIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedTaskId) {
      set.add(selectedTaskId);
      if (settings.showDependenciesOnTrace) {
        taskLinks.forEach((link) => {
          if (link.targetTaskId === selectedTaskId) set.add(link.sourceTaskId);
          if (link.sourceTaskId === selectedTaskId) set.add(link.targetTaskId);
        });
      }
    } else if (perspectivePersonId) {
      // Precision Person trace: ONLY tasks that this specific person participates in!
      tasks.forEach((t) => {
        const isOwner = t.ownerPersonId === perspectivePersonId;
        const isCollab = (t.collaborators || []).some((c) => c.personId === perspectivePersonId);
        const isApprover = t.approverPersonId === perspectivePersonId;
        if (isOwner || isCollab || isApprover) {
          set.add(t.id);
        }
      });
    } else if (selectedRoleId) {
      // Role trace: all tasks of this role
      tasks.forEach((t) => {
        const isOwner = t.ownerRoleId === selectedRoleId;
        const isCollab = (t.collaborators || []).some((c) => c.roleId === selectedRoleId);
        if (isOwner || isCollab) {
          set.add(t.id);
        }
      });
    }
    return set;
  }, [selectedTaskId, perspectivePersonId, selectedRoleId, tasks, taskLinks, settings.showDependenciesOnTrace]);

  const hasSelection = selectedRoleId !== null || selectedTaskId !== null || perspectivePersonId !== null;

  // Build Nodes
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
        draggable: false,
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

  // Build Edges
  const edges = useMemo<Edge[]>(() => {
    const edgeList: Edge[] = [];

    // 1. Responsibility Edges
    tasks.forEach((task) => {
      // Owner edge: solid #2563EB, 3px, arrow
      const isOwnerDimmed =
        hasSelection && !(activeRoleIds.has(task.ownerRoleId) && activeTaskIds.has(task.id));
      const isOwnerHighlighted =
        activeRoleIds.has(task.ownerRoleId) && activeTaskIds.has(task.id);

      edgeList.push({
        id: `edge-owner-${task.ownerRoleId}-${task.id}`,
        source: `role-${task.ownerRoleId}`,
        target: `task-${task.id}`,
        type: 'relationshipEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563EB',
          width: 14,
          height: 14,
        },
        data: {
          relationshipType: 'OWNER',
          roleId: task.ownerRoleId,
          isDimmed: isOwnerDimmed,
          isHighlighted: isOwnerHighlighted,
          label: isOwnerHighlighted ? 'Cầm chính' : undefined,
        },
      });

      // Collaborator edges: dashed #94A3B8, 2px, arrow
      (task.collaborators || []).forEach((collab) => {
        const isCollabDimmed =
          hasSelection && !(activeRoleIds.has(collab.roleId) && activeTaskIds.has(task.id));
        const isCollabHighlighted =
          activeRoleIds.has(collab.roleId) && activeTaskIds.has(task.id);

        edgeList.push({
          id: `edge-collab-${collab.roleId}-${task.id}`,
          source: `role-${collab.roleId}`,
          target: `task-${task.id}`,
          type: 'relationshipEdge',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94A3B8',
            width: 12,
            height: 12,
          },
          data: {
            relationshipType: 'COLLABORATOR',
            roleId: collab.roleId,
            isDimmed: isCollabDimmed,
            isHighlighted: isCollabHighlighted,
            label: isCollabHighlighted ? 'Phối hợp' : undefined,
          },
        });
      });

      // Approver edge: solid #F59E0B, 2px, arrow
      if (
        task.approverRoleId &&
        task.approverRoleId !== task.ownerRoleId &&
        !(task.collaborators || []).some((c) => c.roleId === task.approverRoleId)
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
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#F59E0B',
            width: 12,
            height: 12,
          },
          data: {
            relationshipType: 'APPROVER',
            roleId: task.approverRoleId,
            isDimmed: isApprDimmed,
            isHighlighted: isApprHighlighted,
            label: isApprHighlighted ? 'Người chốt' : undefined,
          },
        });
      }
    });

    // 2. Dependency / Handoff / Feedback Edges
    taskLinks.forEach((link) => {
      const isLinkActive =
        activeTaskIds.has(link.sourceTaskId) && activeTaskIds.has(link.targetTaskId);
      const isLinkDimmed = hasSelection && !isLinkActive;
      const isFeedback = link.linkType === 'FEEDBACK';

      edgeList.push({
        id: `link-${link.id}`,
        source: `task-${link.sourceTaskId}`,
        target: `task-${link.targetTaskId}`,
        type: 'relationshipEdge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isFeedback ? '#10B981' : '#64748B',
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

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (node.id.startsWith('task-')) {
        const taskId = node.id.replace('task-', '');
        updateTaskPosition(taskId, node.position);
      }
    },
    [updateTaskPosition]
  );

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-0 bg-slate-50 dark:bg-slate-950 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      <MapToolbar
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
      />

      <MapLegend />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={resolvedTheme}
        onPaneClick={clearSelection}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={resolvedTheme === 'dark' ? '#334155' : '#cbd5e1'}
          className="opacity-50 dark:opacity-40"
        />
        <Controls showInteractive={false} position="bottom-right" className="!shadow-md" />
        {showMiniMap && (
          <MiniMap
            position="bottom-right"
            className="!bottom-12 !right-4 !m-0 !border !border-slate-200 dark:!border-slate-800 !bg-white/95 dark:!bg-slate-900/95 !rounded-xl !shadow-xl !overflow-hidden"
            style={{ width: 170, height: 110 }}
            nodeStrokeWidth={3}
            nodeColor={(n) => {
              if (n.type === 'roleNode' || n.type === 'role') {
                const rId = n.data?.roleId;
                if (rId === 1) return '#2563EB';
                if (rId === 2) return '#7C3AED';
                if (rId === 3) return '#059669';
                if (rId === 4) return '#EA580C';
                return '#3B82F6';
              }
              return resolvedTheme === 'dark' ? '#475569' : '#94A3B8';
            }}
            maskColor={resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(226, 232, 240, 0.5)'}
          />
        )}
      </ReactFlow>
    </div>
  );
};

export const RelationshipMap: React.FC = () => {
  return (
    <ReactFlowProvider>
      <RelationshipMapContent />
    </ReactFlowProvider>
  );
};
