import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { RoleId } from '../../types';

export interface RelationshipEdgeData {
  relationshipType: 'OWNER' | 'COLLABORATOR' | 'APPROVER' | 'DEPENDENCY' | 'HANDOFF' | 'FEEDBACK';
  roleId?: RoleId;
  isDimmed: boolean;
  isHighlighted: boolean;
  label?: string;
}

export const RelationshipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const edgeData = (data as unknown as RelationshipEdgeData) || {
    relationshipType: 'OWNER',
    isDimmed: false,
    isHighlighted: false,
  };

  const roleColors: Record<RoleId, string> = {
    1: '#2563EB', // Blue
    2: '#7C3AED', // Purple
    3: '#059669', // Green
    4: '#EA580C', // Orange
  };

  let strokeColor = '#94a3b8';
  if (edgeData.roleId && roleColors[edgeData.roleId]) {
    strokeColor = roleColors[edgeData.roleId];
  } else if (edgeData.relationshipType === 'FEEDBACK') {
    strokeColor = '#ec4899';
  } else if (edgeData.relationshipType === 'DEPENDENCY' || edgeData.relationshipType === 'HANDOFF') {
    strokeColor = '#64748b';
  }

  let strokeWidth = 1.5;
  let strokeDasharray = undefined;

  if (edgeData.relationshipType === 'OWNER') {
    strokeWidth = edgeData.isHighlighted ? 3 : 2;
  } else if (edgeData.relationshipType === 'COLLABORATOR') {
    strokeWidth = edgeData.isHighlighted ? 2 : 1.2;
    strokeDasharray = '4 3';
  } else if (edgeData.relationshipType === 'APPROVER') {
    strokeWidth = 1.5;
    strokeDasharray = '2 2';
  } else if (edgeData.relationshipType === 'FEEDBACK') {
    strokeWidth = 2;
    strokeDasharray = '5 4';
  }

  const opacity = edgeData.isDimmed ? 0.08 : edgeData.isHighlighted ? 1 : 0.45;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity,
          transition: 'all 0.2s ease',
        }}
      />
      {edgeData.isHighlighted && edgeData.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs text-slate-700 dark:text-slate-300"
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
