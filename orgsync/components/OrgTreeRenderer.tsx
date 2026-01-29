import React from 'react';
import { TreeData, OrgNode } from '../types';
import { NodeCard } from './NodeCard';

interface OrgTreeRendererProps {
  data: TreeData[];
  onNodeClick: (node: OrgNode) => void;
  onAddChild: (parentId: string) => void;
  hoveredBridgeNodeId: string | null; 
  activeBridgeTargetId: string | null;
  setHoveredBridgeId: (id: string | null) => void;
  onMoveNode: (draggedId: string, targetId: string) => void;
}

const TreeNode: React.FC<{ 
  node: TreeData; 
  onNodeClick: (node: OrgNode) => void;
  onAddChild: (parentId: string) => void;
  hoveredBridgeNodeId: string | null;
  activeBridgeTargetId: string | null;
  setHoveredBridgeId: (id: string | null) => void;
  onMoveNode: (draggedId: string, targetId: string) => void;
}> = ({ node, onNodeClick, onAddChild, hoveredBridgeNodeId, activeBridgeTargetId, setHoveredBridgeId, onMoveNode }) => {
  
  const hasChildren = node.children && node.children.length > 0;
  const isHoveredBridge = hoveredBridgeNodeId === node.id;
  const isBridgePartner = activeBridgeTargetId === node.id;

  return (
    <li>
      <div className="inline-block relative z-10">
        <NodeCard 
          node={node} 
          onClick={onNodeClick} 
          onAddChild={onAddChild}
          isHoveredBridge={isHoveredBridge}
          isBridgePartner={isBridgePartner}
          setHoveredBridgeId={setHoveredBridgeId}
          onMoveNode={onMoveNode}
        />
      </div>

      {hasChildren && (
        <ul>
            {node.children.map((child) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                onNodeClick={onNodeClick} 
                onAddChild={onAddChild} 
                hoveredBridgeNodeId={hoveredBridgeNodeId}
                activeBridgeTargetId={activeBridgeTargetId}
                setHoveredBridgeId={setHoveredBridgeId}
                onMoveNode={onMoveNode}
              />
            ))}
        </ul>
      )}
    </li>
  );
};

export const OrgTreeRenderer: React.FC<OrgTreeRendererProps> = ({ 
  data, 
  onNodeClick, 
  onAddChild,
  hoveredBridgeNodeId,
  activeBridgeTargetId,
  setHoveredBridgeId,
  onMoveNode
}) => {
  return (
    <div className="org-tree">
      <ul>
        {data.map(rootNode => (
          <TreeNode 
            key={rootNode.id} 
            node={rootNode} 
            onNodeClick={onNodeClick} 
            onAddChild={onAddChild} 
            hoveredBridgeNodeId={hoveredBridgeNodeId}
            activeBridgeTargetId={activeBridgeTargetId}
            setHoveredBridgeId={setHoveredBridgeId}
            onMoveNode={onMoveNode}
          />
        ))}
      </ul>
    </div>
  );
};