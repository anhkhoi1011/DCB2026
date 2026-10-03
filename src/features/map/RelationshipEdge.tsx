import React from 'react';
import { BaseEdge, getSmoothStepPath, getBezierPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
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
  const edgeData = (data as unknown as RelationshipEdgeData) || {
    relationshipType: 'OWNER',
    isDimmed: false,
    isHighlighted: false,
  };

  const isFeedback = edgeData.relationshipType === 'FEEDBACK';

  const [edgePath, labelX, labelY] = isFeedback
    ? getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.35,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
      });

  // Strict relationship styling - role colors are NOT used as relation-edge meaning
  let strokeColor = '#64748B';
  let strokeWidth = 2;
  let strokeDasharray = undefined;

  switch (edgeData.relationshipType) {
    case 'OWNER':
      strokeColor = '#2563EB'; // Solid blue 3px
      strokeWidth = edgeData.isHighlighted ? 3.5 : 3;
      strokeDasharray = undefined;
      break;
    case 'COLLABORATOR':
      strokeColor = '#94A3B8'; // Dashed slate 2px
      strokeWidth = edgeData.isHighlighted ? 2.5 : 2;
      strokeDasharray = '5 4';
      break;
    case 'APPROVER':
      strokeColor = '#F59E0B'; // Solid amber 2px
      strokeWidth = edgeData.isHighlighted ? 2.5 : 2;
      strokeDasharray = undefined;
      break;
    case 'FEEDBACK':
      strokeColor = '#10B981'; // Dashed emerald 2px curved
      strokeWidth = edgeData.isHighlighted ? 2.5 : 2;
      strokeDasharray = '6 4';
      break;
    case 'DEPENDENCY':
    case 'HANDOFF':
    default:
      strokeColor = '#64748B'; // Solid slate 2px
      strokeWidth = edgeData.isHighlighted ? 2.5 : 2;
      strokeDasharray = undefined;
      break;
  }

  const opacity = edgeData.isDimmed ? 0.08 : edgeData.isHighlighted ? 1 : 0.55;

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
